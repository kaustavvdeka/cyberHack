from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import asyncio
import json
from datetime import datetime
import traceback

from app.models import TargetRequest, ScanResult
from app.pipeline import AttackPipeline
from app.utils import validate_target_url, sanitize_target_url, is_safe_target

app = FastAPI(title="Pentest Dashboard API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store active scans
active_scans = {}


@app.get("/")
async def root():
    return {"message": "Pentest Dashboard API", "status": "running"}


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_scans": len(active_scans)
    }


@app.websocket("/ws/scan")
async def websocket_scan(websocket: WebSocket):
    """WebSocket endpoint for real-time scan updates"""
    await websocket.accept()
    
    # Store running tasks for this specific connection
    scan_tasks = {}
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("action") == "start_scan":
                target = message.get("target")
                simulation = message.get("simulation", False)
                tools = message.get("tools", None)
                
                # Validate target
                if not target or not validate_target_url(target):
                    await websocket.send_json({
                        "type": "error",
                        "data": {"error": "Invalid target URL"}
                    })
                    continue
                
                # Sanitize target
                target = sanitize_target_url(target)
                
                # Safety check (only if running a real, non-simulated scan)
                if not simulation and not is_safe_target(target):
                    await websocket.send_json({
                        "type": "error",
                        "data": {"error": "Target is not authorized for testing"}
                    })
                    continue
                
                # If there's already an active scan for this connection, cancel it first
                for sid, task in list(scan_tasks.items()):
                    if not task.done():
                        task.cancel()
                scan_tasks.clear()
                
                # Define callback to send JSON message back safely
                async def ws_callback(data):
                    try:
                        await websocket.send_json(data)
                    except:
                        pass
                
                pipeline = AttackPipeline(target, ws_callback, simulation=simulation, tools=tools)
                scan_id = pipeline.scan_id
                active_scans[scan_id] = pipeline
                
                # Send scan started
                await websocket.send_json({
                    "type": "scan_started",
                    "data": {
                        "scan_id": scan_id,
                        "target": target,
                        "timestamp": datetime.now().isoformat()
                    }
                })
                
                # Run pipeline in a background task (non-blocking)
                task = asyncio.create_task(pipeline.run_full_pipeline())
                scan_tasks[scan_id] = task
                
                # Cleanup callback when task finishes
                def make_cleanup(sid, tsk):
                    def cleanup(future):
                        if sid in active_scans:
                            del active_scans[sid]
                        if sid in scan_tasks:
                            del scan_tasks[sid]
                        try:
                            # Check if the task threw an exception and report it
                            exc = future.exception()
                            if exc and not isinstance(exc, asyncio.CancelledError):
                                asyncio.create_task(ws_callback({
                                    "type": "error",
                                    "data": {"tool": "pipeline", "error": str(exc)}
                                }))
                        except asyncio.CancelledError:
                            pass
                        except Exception:
                            pass
                    return cleanup
                
                task.add_done_callback(make_cleanup(scan_id, task))
            
            elif message.get("action") == "stop_scan":
                # Cancel all active tasks for this connection
                for scan_id, task in list(scan_tasks.items()):
                    if not task.done():
                        task.cancel()
                    if scan_id in active_scans:
                        del active_scans[scan_id]
                scan_tasks.clear()
                
                await websocket.send_json({
                    "type": "scan_stopped",
                    "data": {}
                })
                
    except WebSocketDisconnect:
        # Clean up on disconnect
        for scan_id, task in list(scan_tasks.items()):
            if not task.done():
                task.cancel()
            if scan_id in active_scans:
                del active_scans[scan_id]
    except Exception as e:
        try:
            await websocket.close()
        except:
            pass


@app.post("/api/scan/quick", response_model=dict)
async def quick_scan(request: TargetRequest):
    """Quick scan endpoint for basic checks"""
    target = sanitize_target_url(request.url)
    
    if not validate_target_url(target):
        raise HTTPException(status_code=400, detail="Invalid target URL")
    
    if not is_safe_target(target):
        raise HTTPException(status_code=403, detail="Target not authorized")
    
    # Return basic info (simulated for demo)
    return {
        "target": target,
        "status": "completed",
        "quick_checks": {
            "dns_resolution": True,
            "http_accessible": True,
            "https_enabled": target.startswith("https"),
            "basic_security_headers": False
        }
    }
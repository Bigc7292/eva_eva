import os
import uuid
import gradio as gr
import numpy as np
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import Optional
import tempfile
import time
import torch

# Import Dia model
from dia.model import Dia

# Create FastAPI app
app = FastAPI(title="Dia-1.6B API", description="API for Dia-1.6B voice model")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create output directory
os.makedirs("outputs", exist_ok=True)

# Load the model
print("Loading Dia-1.6B model...")
model = Dia.from_pretrained("nari-labs/Dia-1.6B", compute_dtype="float16")
print("Model loaded successfully!")

class TextToSpeechRequest(BaseModel):
    text: str
    seed: Optional[int] = None
    use_torch_compile: Optional[bool] = True

class VoiceCloneRequest(BaseModel):
    text: str
    transcript: str
    seed: Optional[int] = None
    use_torch_compile: Optional[bool] = True

@app.get("/")
def read_root():
    return {"message": "Dia-1.6B API is running"}

@app.post("/tts")
async def text_to_speech(request: TextToSpeechRequest):
    try:
        # Generate a unique ID for this request
        request_id = str(uuid.uuid4())
        output_path = f"outputs/{request_id}.mp3"
        
        # Set seed if provided
        if request.seed is not None:
            torch.manual_seed(request.seed)
            np.random.seed(request.seed)
        
        # Generate audio
        start_time = time.time()
        output = model.generate(
            request.text, 
            use_torch_compile=request.use_torch_compile,
            verbose=True
        )
        generation_time = time.time() - start_time
        
        # Save audio
        model.save_audio(output_path, output)
        
        return {
            "success": True,
            "request_id": request_id,
            "output_path": output_path,
            "generation_time": generation_time,
            "download_url": f"/download/{request_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/voice-clone")
async def voice_clone(
    audio_file: UploadFile = File(...),
    transcript: str = Form(...),
    text: str = Form(...),
    seed: Optional[int] = Form(None),
    use_torch_compile: Optional[bool] = Form(True)
):
    try:
        # Save uploaded audio to a temporary file
        temp_audio = tempfile.NamedTemporaryFile(delete=False, suffix=".mp3")
        temp_audio.write(await audio_file.read())
        temp_audio.close()
        
        # Generate a unique ID for this request
        request_id = str(uuid.uuid4())
        output_path = f"outputs/{request_id}.mp3"
        
        # Set seed if provided
        if seed is not None:
            torch.manual_seed(seed)
            np.random.seed(seed)
        
        # Generate audio with voice cloning
        start_time = time.time()
        output = model.generate_with_audio_prompt(
            prompt_audio_path=temp_audio.name,
            prompt_text=transcript,
            text=text,
            use_torch_compile=use_torch_compile,
            verbose=True
        )
        generation_time = time.time() - start_time
        
        # Save audio
        model.save_audio(output_path, output)
        
        # Clean up temporary file
        os.unlink(temp_audio.name)
        
        return {
            "success": True,
            "request_id": request_id,
            "output_path": output_path,
            "generation_time": generation_time,
            "download_url": f"/download/{request_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{request_id}")
async def download_audio(request_id: str):
    file_path = f"outputs/{request_id}.mp3"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, media_type="audio/mpeg", filename=f"{request_id}.mp3")

# Launch both Gradio and FastAPI
if __name__ == "__main__":
    # Create a simple Gradio interface for testing
    with gr.Blocks() as demo:
        gr.Markdown("# Dia-1.6B API")
        gr.Markdown("This is a REST API for the Dia-1.6B voice model. Use the endpoints below to interact with the model.")
        
        with gr.Tab("Text to Speech"):
            text_input = gr.Textbox(
                label="Text",
                placeholder="[S1] Hello, this is a test. [S2] Yes, it works!",
                lines=5
            )
            seed_input = gr.Number(label="Seed (optional)", precision=0)
            tts_button = gr.Button("Generate")
            audio_output = gr.Audio(label="Generated Audio", type="filepath")
            
            def generate_tts(text, seed):
                try:
                    request_id = str(uuid.uuid4())
                    output_path = f"outputs/{request_id}.mp3"
                    
                    if seed:
                        torch.manual_seed(int(seed))
                        np.random.seed(int(seed))
                    
                    output = model.generate(text, use_torch_compile=True, verbose=True)
                    model.save_audio(output_path, output)
                    
                    return output_path
                except Exception as e:
                    return str(e)
            
            tts_button.click(generate_tts, inputs=[text_input, seed_input], outputs=audio_output)
        
        with gr.Tab("Voice Clone"):
            audio_input = gr.Audio(label="Voice to Clone", type="filepath")
            transcript_input = gr.Textbox(
                label="Transcript of the Audio",
                placeholder="[S1] This is the transcript of the audio I uploaded.",
                lines=3
            )
            clone_text_input = gr.Textbox(
                label="Text to Generate with Cloned Voice",
                placeholder="[S1] This will be spoken in the cloned voice.",
                lines=5
            )
            clone_seed_input = gr.Number(label="Seed (optional)", precision=0)
            clone_button = gr.Button("Generate with Cloned Voice")
            clone_audio_output = gr.Audio(label="Generated Audio with Cloned Voice", type="filepath")
            
            def generate_with_clone(audio_path, transcript, text, seed):
                try:
                    if not audio_path:
                        return "Please upload an audio file"
                    
                    request_id = str(uuid.uuid4())
                    output_path = f"outputs/{request_id}.mp3"
                    
                    if seed:
                        torch.manual_seed(int(seed))
                        np.random.seed(int(seed))
                    
                    output = model.generate_with_audio_prompt(
                        prompt_audio_path=audio_path,
                        prompt_text=transcript,
                        text=text,
                        use_torch_compile=True,
                        verbose=True
                    )
                    model.save_audio(output_path, output)
                    
                    return output_path
                except Exception as e:
                    return str(e)
            
            clone_button.click(
                generate_with_clone, 
                inputs=[audio_input, transcript_input, clone_text_input, clone_seed_input], 
                outputs=clone_audio_output
            )
        
        gr.Markdown("## API Documentation")
        gr.Markdown("""
        ### Endpoints:
        - `POST /tts`: Generate speech from text
        - `POST /voice-clone`: Generate speech with voice cloning
        - `GET /download/{request_id}`: Download generated audio
        
        Check the FastAPI docs at [http://localhost:7860/docs](http://localhost:7860/docs) for more details.
        """)
    
    # Launch both Gradio and FastAPI
    uvicorn.run(app, host="0.0.0.0", port=7860)

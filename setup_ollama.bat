@echo off
echo ========================================
echo  Academic AI - Ollama Model Setup
echo ========================================
echo.
echo This will download required AI models.
echo Total size: ~16GB. Ensure you have enough disk space.
echo.
pause

echo.
echo [1/5] Pulling llama3:8b (main chat model)...
ollama pull llama3:8b

echo.
echo [2/5] Pulling nomic-embed-text (embeddings)...
ollama pull nomic-embed-text

echo.
echo [3/5] Pulling phi3 (fast responses)...
ollama pull phi3

echo.
echo [4/5] Pulling deepseek-coder (code tasks)...
ollama pull deepseek-coder

echo.
echo [5/5] Pulling gemma:7b (alternative model)...
ollama pull gemma:7b

echo.
echo ========================================
echo  All models downloaded successfully!
echo ========================================
echo.
echo You can now start the backend and frontend.
pause

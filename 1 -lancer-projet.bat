@echo off
echo ================================
echo Lancement du projet Kokyage
echo ================================
echo.

:: Vérification si node_modules existe
if not exist "node_modules\" (
    echo [INFO] node_modules n'existe pas.
    echo Installation des dependances en cours...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERREUR] L'installation a echoue !
        pause
        exit /b 1
    )
    echo.
    echo Installation terminee !
    echo.
)

:: Vérification si .env existe
if not exist ".env" (
    echo [ATTENTION] Fichier .env non trouve !
    echo Le projet pourrait ne pas fonctionner correctement.
    echo.
    pause
)

echo Demarrage du serveur de developpement Next.js...
echo.
echo Le serveur sera accessible sur: http://localhost:3000
echo.
echo Appuyez sur Ctrl+C pour arreter le serveur.
echo.

npm run dev

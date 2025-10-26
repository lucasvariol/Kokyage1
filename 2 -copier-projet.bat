@echo off
echo ================================
echo Copie du projet Kokyage
echo ================================
echo.

set SOURCE=%~dp0
for %%F in ("%SOURCE%.") do set PROJECT_NAME=%%~nxF

:: Extraction du numero actuel (ex: mvpV22 -> 22)
set NUMBER=%PROJECT_NAME:~-2%
set /a NEXT_NUMBER=%NUMBER% + 1

:: Construction du nouveau nom avec le numero incremente
set BASE_NAME=%PROJECT_NAME:~0,-2%
set DESTINATION=C:\Users\Lucas\OneDrive\Desktop\Programmation\%BASE_NAME%%NEXT_NUMBER%

echo Source: %SOURCE%
echo Destination: %DESTINATION%
echo.

:: Suppression de l'ancienne copie si elle existe
if exist "%DESTINATION%" (
    echo Suppression de l'ancienne copie...
    rmdir /s /q "%DESTINATION%"
)

echo Copie en cours (sans node_modules, .next, .git)...
echo.

:: Création du dossier de destination
mkdir "%DESTINATION%"

:: Copie de tous les fichiers SAUF node_modules, .next, .git
xcopy "%SOURCE%*" "%DESTINATION%\" /E /I /H /Y /EXCLUDE:%SOURCE%exclude-copy.txt

:: Copie spéciale du fichier .env.local avec un nom différent pour sécurité
if exist "%SOURCE%.env.local" (
    echo Copie du fichier de configuration d'environnement...
    copy "%SOURCE%.env.local" "%DESTINATION%\.env.local.example"
    echo ATTENTION: Fichier .env.local copie en tant que .env.local.example
    echo Renommez-le et configurez vos vraies cles API !
)

echo.
echo ================================
echo Copie terminee !
echo ================================
echo.
echo Projet copie dans: %DESTINATION%
echo.
echo Pour utiliser la copie:
echo 1. cd "%DESTINATION%"
echo 2. npm install
echo 3. Renommer .env.local.example en .env.local
echo 4. Configurer les vraies cles API dans .env.local
echo.
pause

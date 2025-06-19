# Bash commands

- Use only powershell commands
- The root of the repo and project is stock-trading-app
- IMPORTANT - MAKE SURE THE PYTHON ENVIRONMENT WE ARE USING IS sklearn-env

# Workflow

- After editing a file, close it from the ide
- Read the whole project and understand all the code
- Be careful not to break anything that was working while you are trying to change something else
- Always remove empty files
- Dont break something that is already working when making changes that dont affect that area
- If you write test files in the root of the project, put them in a test folder when done
- Make sure theres not more than one test folder
- Do not delete files that are being used when asked to clean project
- When asked to clean project just reorganize and remove all empty files and if you find multiple files with the same name, determine which one to keep and delete the other one
- If a file was deleted that is important to the project, pull it down from github
- Keep the files in the root to a minimum
- Move ALL unnecessary files from root to a proper directory VERY IMPORTANT
- If you write a bunch of files and put them in the root of project, cleanup when your done and move them to their proper directory and move any empty files to NEEDREMOVED directory
- If git changes exceed 15, run a commit
- After moving all the files to NEEDREMOVED folder, then delete them all
- Write unit tests for server and client, playwrite tests, api tests and swagger document the api endpoints
- After every update, look over site and take screen shots to see if theres any errors or issues in the layout
- Only open a new terminal if you want to run a new process that uses the whole terminal, otherwise find one that is not being used.

# Code style

- In the react app always use typescript, no .js files ever!

# Permissions

- These commands are Always-Allow
- Remove-Item
- Get-ChildItem
- Move-Item
- Copy-Item
- cd
- daphne
- netstat
- taskkill
- curl
- Invoke-WebRequest
- Get-Process

**Byte to Bite**
Get started
**1. Navigate to the project**
cd AIGovApp
(Should be AIGovApp/AIGov/App)

**2. Install dependencies**
npm install

**3. Start the app**
npm run start

**4. Set up the server**

Open a second terminal and navigate to the server directory:

cd AIGovApp/server

Create a Python virtual environment:

python -m venv environment

Activate the environment:

Windows:

environment\Scripts\activate

macOS/Linux:

source environment/bin/activate
5. Install server dependencies
pip install -r requirements.txt
6. Start the server
uvicorn server:app --reload

Keep the server terminal running while using the app.

**7. Open the app**

Click 'w' after npm run start

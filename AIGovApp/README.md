# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   # install server deps
   cd server
   pip install -r requirements.txt
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Run server tests

   ```bash
   cd server
   pytest
   ```

CI/Deployment

- The repo includes GitHub Actions workflows to run tests and build Docker images. See `.github/workflows/` for details.


In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

---

## Repository maintenance note

**What changed:** We removed the committed Python virtual environment (`server/.venv`) and its large files from the repository history to fix pushes that were rejected by GitHub due to >100MB files (notably `torch_cpu.dll`).

**Action for collaborators:** After this history rewrite, please re-clone the repository to avoid issues with divergent history:

```bash
# discard local copy and re-clone
cd ..
rm -rf AIGovApp
git clone https://github.com/Bwang101/AIGovApp.git
```

If you need any of the removed artifacts (e.g., large binaries or model files), we recommend distributing them outside the Git repository (release assets, cloud storage, or Git LFS).


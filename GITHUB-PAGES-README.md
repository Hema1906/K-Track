# K-Track — GitHub Pages

This is the normal web version of the project. It is designed to run as a static website on GitHub Pages.

## Deploy
1. Create a GitHub repository.
2. Upload/push the contents of this folder to the repository's default branch.
3. In GitHub, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the branch containing these files and the `/ (root)` folder, then save.
6. GitHub will provide the Pages URL.

`holiday.xlsx` is kept in the project root and `attendance.js` loads it with `fetch("./holiday.xlsx")`.

User-specific data continues to use browser `localStorage`, so each user's browser keeps its own local data. GitHub Pages does not provide a shared database.

## Important
Open the site through the GitHub Pages `https://` URL (or another HTTP/HTTPS server). Do not double-click `index.html` as `file://`, because browsers block `fetch("./holiday.xlsx")` from local files.

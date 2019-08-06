# VisFeature
A stand-alone program for visualizing and analyzing statistical features of biological sequences

## Installation

We have tested these codes on **Windows10-64bit platform** and **Ubuntu 16.04.5 LTS platform**. There is no guarantee that these codes can be compiled and executed on other platforms without modifications. 

- For ***Microsoft Windows platform***, just download the `VisFeature-win32-x64.zip` package from https://github.com/wangjun1996/VisFeature/releases. Unpack it to your favorite location and then open `VisFeature.exe`.

- For ***Linux platform***, just download the `VisFeature-linux-x64.zip` package from https://github.com/wangjun1996/VisFeature/releases. Unpack it to your favorite location. Find out the location of the VisFeature that you unpack and then enter this folder in the terminal. Finally, type and execute the command: `./VisFeature`.

**Please note**: 

- Some anti-virus software may report a risky warning when you first run VisFeature. Please do not worry about it and you can ignore it.
- If system alert **“permission denied”** when you start VisFeature on Linux platform, the Visfeature folder should be granted higher permissions by the command: `chmod 777 -R VisFeature-linux-x64/`, then start VisFeature again.
- Recommended memory (RAM) size: **8GB or larger**. If the memory is too small, it will cause a large file to open without response and the delay of the operation will increase.
- The maximum size of file that can be opened in VisFeature is **5MB**. If you want to use a file that larger than 5MB as input, you can **upload** it on the page of "Density Map Comparison" mode. Uploading file is much faster than opening file, so upload is more recommended.
- The visualization of "Density map comparison" function is based on R software and its ggplot2 package. If you want to execute this visualization on **Linux platform**, please **install R software and its ggplot2 package** first. Because there is no portable version of R software on the Linux platform. Details on how to install R software and its ggplot2 package can be found in the VisFeature manual of Linux platform.

If you got any difficulties, just send emails to wj0708@tju.edu.cn. We will try our best to fix it.

## Development
If you want to run these codes in the development environment, you should install **Node.js** first. Please go to https://nodejs.org/en/download/ download Node.js environment and install that on your machine.

After your Node.js environment is ready, find out the location of the source code of VisFeature that you unpack and enter this directory in command line program. Then type and execute the command: `npm start`. After a few seconds, VisFeature will start.

If you want to **package** application, you should install **electron** and **electron-packager** additionally by executing the command `npm install electron -g` and `npm install electron-packager -g`  in command line program. Then, find out the location of the source code of VisFeature that you unpack and enter this directory. Finally, type and execute the command: `npm run windows` or `npm run linux`  to get corresponding binary release.
# HyperChat
## A fast, secure, and open-source chat app designed for developers and gamers, developed by Justsnoopy30.

## Site Link
### https://hyperchat.cf

## Contributing
To be able to contribute, you'll need some way to test your changes. Refer to the prerequisites and local installation instructions below.

## Prerequisites
- Self-signed TLS certificate and key  
KEY:
`openssl req -newkey rsa:2048 -new -nodes -keyout key.pem -out csr.pem`  
CERT:
`openssl x509 -req -days 365 -in csr.pem -signkey key.pem -out server.crt`
- Local mongodb database

## Local Installation
1. Clone the repo
2. Install dependencies with npm
3. Create a .env file in the root directory of HyperChat, with the following variables set:  
CERT_PATH (TLS certificate path)  
KEY_PATH (TLS key path)  
MONGODB_CONNECTION_URI (Connection URI to your local mongodb server)  
PORT (Port to listen on for the web app)  
4. Start the server with `./StartWebApp.sh` and visit the web app on localhost, with the port you set in the .env file. 

## Contact
You can contact me on Discord with my username and tag: Justsnoopy30#0001  
Or, you can join the Discord server for my projects with this link: https://discord.gg/GDXgtqZ

## Licensing Note
All code is licensed under AGPL-3.0 except for external libraries licensed under their own license.

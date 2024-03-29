/**
 * Web server request and response handler module.
 * @module Request Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2021
 * @license AGPL-3.0
 */

// At the start, import the needed modules
import path from 'path';
import fs from 'fs';
import etag from 'etag';
import mimeTypes from './WebMimeTypes.js';

// The web server request and response handler
function handleRequest(req, res) {
  // Stop Poison Null Byte attacks
  if (req.url.indexOf('\0') !== -1 || req.url.indexOf('%00') !== -1) {
    res.writeHead(400);
    res.end('400 Bad Request\nPoison Null Bytes are evil.');
    return;
  }

  // Define the request url variable
  let reqURL;

  // Set a base url variable for the web app to the request hostname
  const baseURL = `https://${req.headers.host}/`;

  // Try and make a new URL for the requested URL
  // If it fails due to an invalid url provided, send back 400 Bad Request
  try {
    reqURL = new URL(req.url, baseURL);
  } catch (error) {
    res.writeHead(400);
    res.end('400 Bad Request\nInvalid URL supplied.');
    return;
  }

  let decodedPathname = decodeURIComponent(reqURL.pathname);

  // Check pathname for poison null byte attacks again after decoding
  if (decodedPathname.indexOf('\0') !== -1 || decodedPathname.indexOf('%00') !== -1) {
    res.writeHead(400);
    res.end('400 Bad Request\nPoison Null Bytes are evil. Nice try.');
    return;
  }

  // If the URL is simply a slash or home url, send the chat app html page
  if (decodedPathname == '/')
    decodedPathname = '/resources/chat.html';
  // Provide chat.js and service-worker.js in the root directory so that the client's service worker can use the scope of the entire app
  if (decodedPathname == '/chat.js')
    decodedPathname = '/resources/chat.js';
  if (decodedPathname == '/service-worker.js')
    decodedPathname = '/resources/service-worker.js';

  // Set the path to the requested resource based on the URL
  const pathname = path.join(process.cwd() + '/client', decodedPathname);

  // Set the extension name variable based on the file extension in the pathname
  const extname = String(path.extname(pathname)).toLowerCase();

  // Set the content type sent back to the client which will either be one of the mime types defined or octet-stream
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  // Try to read the requested file based on the pathname
  fs.readFile(pathname, function (error, content) {
    // If there's an error, handle it
    if (error) {
      // If the error is that the file is not found, handle it
      if (error.code == 'ENOENT') {
        // If the path is a user profile picture, and the profile picture for the user
        // does not exist, then serve the generic profile picture
        if (decodedPathname.startsWith('/cdn/UserProfilePictures/')) {
          fs.readFile('./client/cdn/Defaults/UserProfilePictures/generic.webp', function (error, content) {
            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Length': Buffer.byteLength(content),
              'ETag': etag(content)
            });
            res.end(content, 'utf-8');
            return;
          });
        } else if (decodedPathname.startsWith('/cdn/ServerIcons/')) {
          fs.readFile('./client/cdn/Defaults/ServerIcons/generic.webp', function (error, content) {
            res.writeHead(200, {
              'Content-Type': contentType,
              'Content-Length': Buffer.byteLength(content),
              'ETag': etag(content)
            });
            res.end(content, 'utf-8');
            return;
          });
        }
        // Otherwise, if it's not a user profile picture or server icon requested, serve the 404 Not Found page
        else {
          fs.readFile('./client/errors/404.html', function (error, content) {
            res.writeHead(404, {
              'Content-Type': 'text/html',
              'Content-Length': Buffer.byteLength(content),
              'ETag': etag(content)
            });
            res.end(content, 'utf-8');
            return;
          });
        }
      // If the error code is not file not found, send a generic 500 error indicating something went wrong
      }
      else {
        res.writeHead(500);
        res.end(`Error: ${error.code}\nSomething went wrong.`);
        return;
      }
    // Yay, there's no error, so send the requested content back to the client
    }
    else {
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': Buffer.byteLength(content),
        'ETag': etag(content)
      });
      res.end(content, 'utf-8');
    }
  });
}

// Export the handleRequest function as the default export
export default handleRequest;

/**
 * Module to handle the socket upload profile picture event.
 * @module Socket Upload Profile Picture Event Handler
 * @author Justsnoopy30 <justsnoopy30@hypercubemc.tk>
 * @copyright Justsnoopy30 2020
 * @license AGPL-3.0
 */

import path from 'path';
import { promises as fs } from 'fs';
import sharp from 'sharp';

async function handleUploadProfilePicture({io, socket, profilePicture}) {
  if (profilePicture == null) {
    return;
  }

  const pathname = path.join(process.cwd() + '/client/cdn/UserProfilePictures/', socket.username.toLowerCase() + '.webp');

  const buffer = Buffer.from(profilePicture);

  const convertedBuffer = await sharp(buffer, { pages: -1 }).webp().toBuffer().catch(error => {
    console.error(`An error occurred while attempting to convert the uploaded profile picture for ${socket.username}: ${error}`);
  });

  await fs.writeFile(pathname, convertedBuffer).catch(error => {
    console.error(`An error occurred while attempting to update the profile picture for ${socket.username}: ${error}`);
  });
  console.log(`Updated the profile picture for ${socket.username} successfully!`);
}

// Export the handleUploadProfilePicture function as the default export
export default handleUploadProfilePicture;


const APP_ID = "03cce7507ee74a1182d8175d82229f8b";
let uid = sessionStorage.getItem("uid");
if (!uid) {
  uid = Math.floor(Math.random() * 1000001);
  sessionStorage.setItem("uid", uid);
}

let token = sessionStorage.getItem("token") || null;
let client;
const queryStr = window.location.search;
const urlParams = new URLSearchParams(queryStr);
let roomId = urlParams.get("room");
if (!roomId) {
  roomId = "main";
}

let localTracks = [];
let remoteUsers = {};

let localScreenTracks;
let shareingScreen = false;


const joinRoomInit = async () => {
  try {
    // Check browser compatibility
    if (!AgoraRTC.checkSystemRequirements()) {
      console.error("WebRTC is not supported in this browser.");
      return;
    }

    client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
    await client.join(APP_ID, roomId, token, uid);
    console.log("User " + uid + " join room successfully");

    // here call the function to handle the user-published event
    await client.on("user-published", handlerUserPublished);
    await client.on("user-left", userLeftHandler);

    // here call the function to join the stream
    await joinStream();

  } catch (error) {
    console.error("Failed to join the room:", error);
  }
};

const joinStream = async () => {
  try {
    // in createMicrophoneAndCameraTracks() we can pass the resolution of the video in the second parameter, in first parameter we can pass the audio and video constraints
    // congiguration for the video resolution in endcoderConfig
    localTracks = await AgoraRTC.createMicrophoneAndCameraTracks({}, {
      encoderCofig: {
        width: { max: 640, ideal: 1920, max: 1920 },
        height: { max: 480, ideal: 1080, max: 1080 },
      }
    });

    const player = `
      <div class="video__container" id="user-container-${uid}">
        <div class="video-player" id="user-${uid}"></div>
      </div>
    `;

    document.getElementById("streams__container").insertAdjacentHTML("beforeend", player);
    // here call the function to expand the video for specific user
    document.getElementById(`user-container-${uid}`).addEventListener("click", expandVideo);

    localTracks[1].play(`user-${uid}`);

    // here publish the audio and video tracks for client
    await client.publish([localTracks[0], localTracks[1]]);

  } catch (error) {
    console.error("Failed to create and play tracks:", error);
  }
};


let handlerUserPublished = async function (user, mediaType) {
  try {
    remoteUsers[user.uid] = user;

    // here call the function to subscribe to the remote user
    await client.subscribe(user, mediaType);
  
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player === null) {      
      player = `
       <div class="video__container" id="user-container-${user.uid}">
         <div class="video-player" id="user-${user.uid}"></div>
       </div>
      `;
      document.getElementById("streams__container").insertAdjacentHTML("beforeend", player);
      // here call the function to expand the video for specific user
      document.getElementById(`user-container-${user.uid}`).addEventListener("click", expandVideo);
    }

    // (optional) it'll shirnk the video frame if user is in display frame
    if(displayFrame.style.display){
      let videoFrame = document.getElementById(`user-container-${user.uid}`);
      videoFrame.style.width = '100px';
      videoFrame.style.height = '100px';
    }

  
    if (mediaType === "video") {
      user.videoTrack.play(`user-${user.uid}`);
    }

    if (mediaType === "audio") {
      user.audioTrack.play();
    }

  } catch (error) {
    console.error("Failed to subscribe:", error);
  }
}


// it will be called when the user leaves the room then remove the player frm the page
let userLeftHandler = async (user) => {
  try {
    delete remoteUsers[user.uid];
    document.getElementById(`user-container-${user.uid}`).remove();

    // if current user is in display frame then displayframe dom also remove it from the page
    if(userIdInDisplayFrame === 'user-container-'+user.uid){
       displayFrame.style.display = null
      
       // (optional) if displayfram is removed then it'll increate the size of the users profile
       let videoFrames = document.getElementsByClassName('video__container');
       for ( let videoframe of videoFrames){
         videoframe.style.width = '150px';
         videoframe.style.height = '150px';
       }
    }

  } catch (error) {
    console.error("Failed to remove the user:", error);
  }
}


// it will be called when the user click on the video frame then it'll expand the camera video frame
let switchToCamera = async () => {
  try {
    // here we inserrting the player for the camera in a display frame
    player = `
       <div class="video__container" id="user-container-${uid}">
         <div class="video-player" id="user-${uid}"></div>
       </div>
      `;

    document.getElementById("streams__container").insertAdjacentHTML("beforeend", player);
    displayFrame.insertAdjacentHTML("beforeend", player);

    // mute the audio and video tracks for the screen 
    await localTracks[0].setMuted(true);
    await localTracks[1].setMuted(true);

    document.getElementById(`mic-btn`).classList.remove('active');
    document.getElementById(`screen-btn`).classList.remove('active');

    // then we are going to publish the camera tracks & unpublish the screen tracks according to the user
    localTracks[1].play(`user-${uid}`); // play the camera tracks in the display frame of the user
    await client.publish(localTracks[1]); // only publish the camera tracks


  } catch (error) {
    console.error("Failed to switch to camera:", error);
  }
}


// toggle camera
let camerabtn = document.getElementById('camera-btn');
let toggleCamera = async (e) => {
  let btn = e.currentTarget;

  if(localTracks[1].muted){
    await localTracks[1].setMuted(false);
    btn.innerHTML = 'Camera Off'; 
    btn.classList.add('active');
  }else{
    await localTracks[1].setMuted(true);
    btn.innerHTML = 'Camera On';
    btn.classList.remove('active');
  }
}

camerabtn.addEventListener('click', toggleCamera);


// toggle camera
let micbtn = document.getElementById('mic-btn');
let togglemic = async (e) => {
  let btn = e.currentTarget;

  if(localTracks[0].muted){
    await localTracks[0].setMuted(false);
    btn.innerHTML = 'mic Off'; 
    btn.classList.add('active');
  }else{
    await localTracks[0].setMuted(true);
    btn.innerHTML = 'mic On';
    btn.classList.remove('active');
  }
}

micbtn.addEventListener('click', togglemic);


// share screen 
let toggleScreenShare = async (e) => {
  let screenbtn = e.currentTarget;

  if(!shareingScreen){
    shareingScreen = true;
    screenbtn.classList.add('active');
    camerabtn.classList.remove('active'); // if camera is on then it'll after sharing screen it'll off the camera
    camerabtn.style.display = 'none';

    localScreenTracks = await AgoraRTC.createScreenVideoTrack();
    document.getElementById(`user-container-${uid}`).remove();
    displayFrame.style.display = 'block';

    let player = `
    <div class="video__container" id="user-container-${uid}">
      <div class="video-player" id="user-${uid}"></div>
    </div>
   `;

    displayFrame.insertAdjacentHTML("beforeend", player);
    
    // after adding share screen frame user can taggle the video frame
    document.getElementById(`user-container-${uid}`).addEventListener("click", expandVideo);

    userIdInDisplayFrame = `user-container-${uid}`;
    localScreenTracks.play(`user-${uid}`);

    // when user share the screen then it'll unpublish the video track
    await client.unpublish([localTracks[1]]);
    // and publish the screen track
    await client.publish([localScreenTracks]);


    // (optional) if displayfram is removed then it'll increate the size of the users profile
    let videoFrames = document.getElementsByClassName('video__container');
    for ( let videoframe of videoFrames){
      if(videoframe.id != userIdInDisplayFrame){
        videoframe.style.width = '100px';
        videoframe.style.height = '100px';
      }
    }


  }else{
    shareingScreen = false;
    camerabtn.style.display = 'block';
    document.getElementById(`user-container-${uid}`).remove();
    await client.unpublish([localScreenTracks]);

    // after removing the display frame it'll publish the video track
    switchToCamera();

  }
}

document.getElementById('screen-btn').addEventListener('click', toggleScreenShare);



joinRoomInit();




let messagesContainer = document.getElementById('messages');
messagesContainer.scrollTop = messagesContainer.scrollHeight;

const memberContainer = document.getElementById('members__container');
const memberButton = document.getElementById('members__button');

const chatContainer = document.getElementById('messages__container');
const chatButton = document.getElementById('chat__button');

let activeMemberContainer = false;

memberButton.addEventListener('click', () => {
  if (activeMemberContainer) {
    memberContainer.style.display = 'none';
  } else {
    memberContainer.style.display = 'block';
  }

  activeMemberContainer = !activeMemberContainer;
});


// custom code

let activeChatContainer = false;

// 
chatButton.addEventListener('click', () => {
  if (activeChatContainer) {
    chatContainer.style.display = 'none';
  } else {
    chatContainer.style.display = 'block';
  }

  activeChatContainer = !activeChatContainer;
});

 
let displayFrame = document.getElementById('stream__box');
let videoFrames = document.getElementsByClassName('video__container');
let streamsContainer = document.getElementById('streams__container');
let userIdInDisplayFrame = null;

// it will be called when user click on the video frame
// & ll be used to expand the video frame with specific user
let expandVideo = (e)=>{
    let child = displayFrame.children[0];
    if(child){
      streamsContainer.appendChild(child);
    }
    displayFrame.style.display = 'block';
    displayFrame.appendChild(e.currentTarget);
    userIdInDisplayFrame = e.currentTarget.id;

   // then it'll used to expand the video with full screen according to this style
   for (let videoframe of videoFrames) {
    
    // if user is not then others users display frame will be small
    if(videoframe.id != userIdInDisplayFrame){
      videoframe.style.width = '70px';
      videoframe.style.height = '70px';
    }

    videoframe.style.width = '100px';
    videoframe.style.height = '100px';
  }
  
}

for (let videoframe of videoFrames) {
  videoframe.addEventListener('click', expandVideo);
}




// hide / toggle displayframe when user click on the display frame

let hideDisplayFrame = ()=>{
  displayFrame.style.display = null;
  userIdInDisplayFrame = null;

  let child = displayFrame.children[0];
  streamsContainer.appendChild(child);

  // then all users display frame will be before the same
  for (let videoframe of videoFrames) {
    videoframe.style.width = '150px';
    videoframe.style.height = '150px';
  }
}

displayFrame.addEventListener('click', hideDisplayFrame);
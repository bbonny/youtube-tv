import fetch from 'isomorphic-fetch';

export const YOUTUBE_UPDATE_VIDEO_ERROR = 'YOUTUBE_UPDATE_VIDEO_ERROR';
export const YOUTUBE_UPDATE_VIDEO_START = 'YOUTUBE_UPDATE_VIDEO_START';
export const YOUTUBE_UPDATE_VIDEO_SUCCESS = 'YOUTUBE_UPDATE_VIDEO_SUCCESS';

export function updateVideo() {
  console.log("Starting video fetching")
  return ({ }) => {
    const promise = fetch(
      'https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=es&videoCategoryId=17&key=AIzaSyC_t0fTvGu4N_mxY95hT0htr6LICzUNZ1g')
    .then(response => response.json())
    .then(json => json);

    console.log("Starting  fetching")
    return {
      type: 'YOUTUBE_UPDATE_VIDEO',
      payload: promise,
    };
  };
}

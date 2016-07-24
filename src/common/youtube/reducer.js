import * as actions from './actions';
import { Map } from 'immutable';
import { Record } from '../transit';

const InitialState = Record({
  video: Map(),
  loading: false,
  loaded: false,
}, 'youtube');

export default function youtubeReducer(state = new InitialState, action) {
  switch (action.type) {

    case actions.YOUTUBE_UPDATE_VIDEO_START: {
      return state
        .set('video', Map())
        .set('loading', true)
        .set('loaded', false)
    }

    case actions.YOUTUBE_UPDATE_VIDEO_SUCCESS: {
      console.log(action.payload.items);
      return state
        .set('video', action.payload.items)
        .set('loading', false)
        .set('loaded', true)
    }
  }
  return state;
}

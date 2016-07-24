import './Youtube.scss';
import Component from 'react-pure-render/component';
import React, { PropTypes } from 'react';
import cx from 'classnames';
import { connect } from 'react-redux';
import { updateVideo } from '../../common/youtube/actions';
import YouTube from 'react-youtube';

// Presentational component.
export default class Youtube extends Component {

  static propTypes = {
    updateVideo: PropTypes.func.isRequired
  };

  constructor() {
    super();
  }

  componentDidMount() {
    this.props.updateVideo();
  }

  render() {
    const { video } = this.props;

    console.log(video);
    return (
      <ol className="video">
        {video.map(video =>
          <YouTube videoId={video.id} />
        )}
      </ol>
    );
  }

}

export default connect(state => ({
  video: state.youtube.video
}), { updateVideo })(Youtube);

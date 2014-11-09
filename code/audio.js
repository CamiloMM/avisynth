var newPlugin = require('./plugin-definition-system').newPlugin;

// Audio processing filters

newPlugin('Amplify(rmd:)');
newPlugin('AmplifydB(rmd:)');
newPlugin('AssumeSampleRate(ri:)');
newPlugin('AudioDub(rv:, rv:)');
newPlugin('AudioDubEx(rv:, rv:)');
newPlugin('AudioTrim(rd:, rd:)');
newPlugin('ConvertAudioTo8bit(v:)');
newPlugin('ConvertAudioTo16bit(v:)');
newPlugin('ConvertAudioTo24bit(v:)');
newPlugin('ConvertAudioTo32bit(v:)');
newPlugin('ConvertAudioToFloat(v:)');
newPlugin('ConvertToMono(v:)');
newPlugin('GetChannel(rmi:)');
newPlugin('GetChannels(rmi:)');
newPlugin('GetLeftChannel(v:)');
newPlugin('GetRightChannel(v:)');
newPlugin('MergeChannels(rmv:)');
newPlugin('MonoToStereo(rv:, v:)');
newPlugin('ResampleAudio(ri:, i:)');
newPlugin('SSRC(ri:, b:)');
newPlugin('DelayAudio(rd:)');
newPlugin('EnsureVBRMP3Sync(v:)');
newPlugin('KillAudio(v:)');
newPlugin('KillVideo(v:)');
newPlugin('MixAudio(rv:, v:, d:, d:)');
newPlugin('Normalize(d:volume, b:show)');
newPlugin('SuperEQ(rap:, d:, d:, d:, d:, d:, d:, d:, d:, d:, d:, d:, d:, d:, d:, d:, d:, d:)');
newPlugin('TimeStretch(d:tempo, d:rate, d:pitch, i:sequence, i:seekwindow, i:overlap, b:quickseek, i:aa)');

var newPlugin = require('./plugin-definition-system').newPlugin;

// Timeline editing filters

var fpsPresets = 'ntsc_film, ntsc_video, ntsc_double, ntsc_quad, ntsc_round_film, ntsc_round_video, ntsc_round_double, ntsc_round_quad, film, pal_film, pal_video, pal_double, pal_quad';

newPlugin('AlignedSplice(rv:, rv:, mv:)');
newPlugin('UnalignedSplice(rv:, rv:, mv:)');
newPlugin('AssumeFPS(rat:, a:, a:)', fpsPresets);
newPlugin('AssumeScaledFPS(i:multiplier, i:divisor, b:sync_audio)');
newPlugin('ChangeFPS(rat:, a:, a:)', fpsPresets);
newPlugin('ConvertFPS(rat:, a:, a:, a:)', fpsPresets);
newPlugin('DeleteFrame(rmi:)');
newPlugin('Dissolve(rmv:, i:, d:fps)');
newPlugin('DuplicateFrame(rmi:)');
newPlugin('FadeIn(ri:, c:color, d:fps)');
newPlugin('FadeIO(ri:, c:color, d:fps)');
newPlugin('FadeOut(ri:, c:color, d:fps)');
newPlugin('FadeIn0(ri:, c:color, d:fps)');
newPlugin('FadeIO0(ri:, c:color, d:fps)');
newPlugin('FadeOut0(ri:, c:color, d:fps)');
newPlugin('FadeIn2(ri:, c:color, d:fps)');
newPlugin('FadeIO2(ri:, c:color, d:fps)');
newPlugin('FadeOut2(ri:, c:color, d:fps)');
newPlugin('FreezeFrame(ri:, ri:, ri:)');
newPlugin('Interleave(rmv:)');
newPlugin('Loop(i:, i:, i:)');
newPlugin('Reverse(v:)');
newPlugin('SelectEven(v:)');
newPlugin('SelectOdd(v:)');
newPlugin('SelectEvery(ri:, ri:, mi:)');
newPlugin('SelectRangeEvery(i:every, i:length, i:offset, b:audio)');
newPlugin('Trim(ri:, ri:, b:pad)');

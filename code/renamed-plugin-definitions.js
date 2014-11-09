var newPlugin = require('./plugin-definition-system').newPlugin;

"(I'm renaming this file to see if CodeClimate is not being retarded).";

// This file contains a wrapper of each of the various core filters
// bundled with AviSynth, to ease their usage in script instances.

// As clarification for whoever reads this in the future: I'm using a custom ad-hoc syntax
// that describes how they work, this allows me to define a whole filter in a single line.
// Check the file required above (plugin-definition-system.js) for more info.

// Shared type definitions.
var imgTypes = 'Y8, RGB24, RGB32';
var dssTypes = 'YV24, YV16, YV12, YUY2, AYUV, Y41P, Y411, ARGB, RGB32, RGB24, YUV, YUVex, RGB, AUTO, FULL';
var aviTypes = 'YV24, YV16, YV12, YV411, YUY2, RGB32, RGB24, Y8, AUTO, FULL';
var matrices = 'Rec601, PC.601, Rec709, PC.709, AVERAGE';
var showTypes = 'RGB24, RGB32, YUY2, YV12, Y8';
var overlayModes = 'Blend, Add, Subtract, Multiply, Chroma, Luma, Lighten, Darken, SoftLight, HardLight, Difference, Exclusion';
var fpsPresets = 'ntsc_film, ntsc_video, ntsc_double, ntsc_quad, ntsc_round_film, ntsc_round_video, ntsc_round_double, ntsc_round_quad, film, pal_film, pal_video, pal_double, pal_quad';

// Shared parameter lists.
var imgParams = 'f:, ni:start, i:end, d:fps, b:use_DevIL, b:info, t:pixel_type';
var dssParams = 'f:, nd:fps, b:seek, b:audio, b:video, b:convertfps, b:seekzero, i:timeout, t:pixel_type, i:framecount, p:logfile, i:logmask';
var aviParams = 'mf:, b:audio, t:pixel_type, q:fourCC';
var convertParams = 't:matrix, b:interlaced, q:ChromaInPlacement, q:chromaresample';
var mergeParams = 'rv:, rv:, d:weight';

// Media file filters
newPlugin('AviSource', aviParams, aviTypes);
newPlugin('OpenDMLSource', aviParams, aviTypes);
newPlugin('AviFileSource', aviParams, aviTypes);
newPlugin('WavSource(mf:)');
newPlugin('DirectShowSource', dssParams, dssTypes);
newPlugin('ImageSource', imgParams, imgTypes);
newPlugin('ImageReader', imgParams, imgTypes);
newPlugin('ImageSourceAnim(f:, nd:fps, b:info, t:pixel_type)', imgTypes);
newPlugin('ImageWriter(f:, i:start, i:end, q:type, b:info)');
newPlugin('SegmentedAviSource(mf:, b:audio, t:pixel_type)', aviTypes);
newPlugin('SegmentedDirectShowSource(mf:, d:fps, b:seek, b:audio, b:video, b:convertfps, b:seekzero, i:timeout, t:pixel_type)', dssTypes);
newPlugin('SoundOut');

// Color conversion and adjustment filters
newPlugin('ColorYUV(d:gain_y, d:off_y, d:gamma_y, d:cont_y, d:gain_u, d:off_u, d:gamma_u, d:cont_u, d:gain_v, d:off_v, d:gamma_v, d:cont_v, q:levels, q:opt, b:showyuv, b:analyze, b:autowhite, b:autogain, b:conditional)');
newPlugin('ConvertBackToYUY2(t:matrix)', matrices);
newPlugin('ConvertToRGB', convertParams, matrices);
newPlugin('ConvertToRGB24', convertParams, matrices);
newPlugin('ConvertToRGB32', convertParams, matrices);
newPlugin('ConvertToYUY2', convertParams, matrices);
newPlugin('ConvertToY8(t:matrix)', matrices);
newPlugin('ConvertToYV411', convertParams, matrices);
newPlugin('ConvertToYV12', convertParams + ', q:ChromaOutPlacement', matrices);
newPlugin('ConvertToYV16', convertParams, matrices);
newPlugin('ConvertToYV24', convertParams, matrices);
newPlugin('FixLuminance(i:, i:)');
newPlugin('Greyscale(q:matrix)');
newPlugin('Invert(q:channels)');
newPlugin('Levels(ri:, rd:, ri:, ri:, ri:, b:coring, b:dither)');
newPlugin('Limiter(i:min_luma, i:max_luma, i:min_chroma, i:max_chroma, t:show)', 'luma, luma_grey, chroma, chroma_grey');
newPlugin('MergeARGB(rv:, rv:, rv:, rv:)');
newPlugin('MergeRGB(rv:, rv:, rv:, t:pixel_type)', 'RGB24, RGB32');
newPlugin('Merge', mergeParams);
newPlugin('MergeChroma', mergeParams);
newPlugin('MergeLuma', mergeParams);
newPlugin('RGBAdjust(d:, d:, d:, d:, d:rb, d:gb, d:bb, d:ab, d:rg, d:gg, d:bg, d:ag, b:analyze, b:dither)');
newPlugin('ShowAlpha(t:pixel_type)', showTypes);
newPlugin('ShowBlue(t:pixel_type)', showTypes);
newPlugin('ShowGreen(t:pixel_type)', showTypes);
newPlugin('ShowRed(t:pixel_type)', showTypes);
newPlugin('SwapUV(v:)');
newPlugin('UToY(v:)');
newPlugin('VToY(v:)');
newPlugin('UToY8(v:)');
newPlugin('VToY8(v:)');
newPlugin('YToUV(rv:, rv:, v:)');
newPlugin('Tweak(d:hue, d:sat, d:bright, d:cont, b:coring, b:sse, d:startHue, d:endHue, d:maxSat, d:minSat, d:interp, b:dither)');

// Overlay and Mask filters
newPlugin('Layer(rv:, rv:, t:op, i:level, i:x, i:y, i:threshold, b:use_chroma)', 'add, subtract, lighten, darken, fast, mul');
newPlugin('Mask(rv:, v:)');
newPlugin('ResetMask(v:)');
newPlugin('ColorKeyMask(c:, i:, i:, i:)');
newPlugin('MaskHS(i:startHue, i:endHue, i:maxSat, i:minSat, b:coring)');
newPlugin('Overlay(rv:, i:x, i:y, v:mask, d:opacity, t:mode, b:greymask, q:output, b:ignore_conditional, b:pc_range)', overlayModes);
newPlugin('Subtract(rv:, rv:)');

// Geometric deformation filters
newPlugin('AddBorders(ri:, ri:, ri:, ri:, c:color)');
newPlugin('Crop(ri:, ri:, ri:, ri:, b:align)');
newPlugin('CropBottom(ri:)');
newPlugin('FlipHorizontal');
newPlugin('FlipVertical');
newPlugin('Letterbox(ri:, ri:, i:x1, i:x2, c:color)');
newPlugin('HorizontalReduceBy2');
newPlugin('VerticalReduceBy2');
newPlugin('ReduceBy2');
newPlugin('SkewRows(ri:)');
newPlugin('TurnLeft');
newPlugin('TurnRight');
newPlugin('Turn180');
newPlugin( 'BicubicResize(ri:, ri:, d:b, d:c, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('BilinearResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('BlackmanResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height, i:taps)');
newPlugin(   'GaussResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height, d:p)');
newPlugin( 'LanczosResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height, i:taps)');
newPlugin('Lanczos4Resize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin(   'PointResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin(    'SincResize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height, i:taps)');
newPlugin('Spline16Resize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('Spline36Resize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');
newPlugin('Spline64Resize(ri:, ri:, d:src_left, d:src_top, d:src_width, d:src_height)');

// Pixel restoration filters
newPlugin('Blur(rd:, d:, b:MMX)');
newPlugin('Sharpen(rd:, d:, b:MMX)');
newPlugin('GeneralConvolution(i:bias, q:matrix, d:divisor, b:auto)');
newPlugin('SpatialSoften(ri:, ri:, ri:)');
newPlugin('TemporalSoften(ri:, ri:, ri:, i:scenechange, i:mode)');
newPlugin('FixBrokenChromaUpsampling');

// Timeline editing filters
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

// Interlace filters
newPlugin('AssumeFieldBased(v:)');
newPlugin('AssumeFrameBased(v:)');
newPlugin('AssumeBFF(v:)');
newPlugin('AssumeTFF(v:)');
newPlugin('ComplementParity(v:)');
newPlugin('Bob(d:b, d:c, i:height)');
newPlugin('Weave(v:)');
newPlugin('DoubleWeave(v:)');
newPlugin('WeaveColumns(ri:)');
newPlugin('WeaveRows(ri:)');
newPlugin('PeculiarBlend(ri:)');
newPlugin('Pulldown(ri:, ri:)');
newPlugin('SeparateFields(v:)');
newPlugin('SeparateColumns(ri:)');
newPlugin('SeparateRows(ri:)');
newPlugin('SwapFields(v:)');

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

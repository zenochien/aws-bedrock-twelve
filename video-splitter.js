const ffmpeg = require('fluent-ffmpeg');

function splitVideo(inputPath, outputDir, segmentDuration = 30) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-c copy',
                '-map 0',
                `-segment_time ${segmentDuration}`,
                '-f segment',
                '-reset_timestamps 1'
            ])
            .output(`${outputDir}/segment_%03d.mp4`)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
}

module.exports = { splitVideo };
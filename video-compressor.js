const ffmpeg = require('fluent-ffmpeg');

function compressVideo(inputPath, outputPath, quality = 28) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .videoCodec('libx264')
            .outputOptions([
                `-crf ${quality}`,
                '-preset fast',
                '-vf scale=720:-2'
            ])
            .output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });
}

module.exports = { compressVideo };
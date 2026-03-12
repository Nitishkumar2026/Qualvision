// Test the parsing logic
const testOutput = `{"type": "progress", "step": "structural_analysis_start", "message": "Initializing structural pattern recognition"}
{"type": "progress", "step": "orb_analysis", "message": "Extracting ORB feature descriptors"}
{"type": "progress", "step": "ssim_analysis", "message": "Calculating Structural Similarity Index"}
{"type": "progress", "step": "detailed_analysis_start", "message": "Starting component-level verification"}
{"type": "progress", "step": "part_analysis", "message": "Analyzing part 1/31: small_washer_2"}

__RESULT_START__
{"valid": true, "parts": [{"id": 1, "name": "test", "stencilValue": 1, "status": "present", "deviation": 0, "pixelCount": 100, "confidence": 0.95}], "partsAnalyzed": 1, "partsPassed": 1, "partsFailed": 0, "globalSimilarity": 0.95}
__RESULT_END__`;

// Parse Python result - look for the encapsulated result block
let result;
const startMarker = "__RESULT_START__";
const endMarker = "__RESULT_END__";

const startIdx = testOutput.lastIndexOf(startMarker);
const endIdx = testOutput.lastIndexOf(endMarker);

console.log("Start Index:", startIdx);
console.log("End Index:", endIdx);

if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonString = testOutput.substring(startIdx + startMarker.length, endIdx).trim();
    console.log("Extracted JSON String:");
    console.log(jsonString);
    console.log("---");

    try {
        result = JSON.parse(jsonString);
        console.log("Parsed successfully!");
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error parsing delimited JSON result:", e);
        console.error("Delimited string was:", jsonString);
    }
} else {
    console.log("Markers not found or invalid positions");
}

if (!result) {
    console.error("Failed to parse!");
} else {
    console.log("SUCCESS! Result valid:", result.valid);
}

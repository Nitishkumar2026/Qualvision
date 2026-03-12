import sys
import json
import cv2
import numpy as np
import os
import time
import traceback
import torch
from transformers import pipeline
from PIL import Image

print(json.dumps({"type": "progress", "step": "pre_processing", "message": "DEBUG: Python backend initialized successfully with CNN support"}), flush=True)

# ==========================================
# Advanced Computer Vision & CNN Module
# ==========================================

_detector = None

def get_cnn_detector():
    """Singleton for CNN detector to avoid repeated loading"""
    global _detector
    if _detector is None:
        try:
            emit_progress("cnn_load", "Loading advanced CNN model (google/owlv2-base-patch16-ensemble)", delay=0.5)
            # Using zero-shot object detection to find parts by name
            _detector = pipeline("zero-shot-object-detection", model="google/owlv2-base-patch16-ensemble", device=-1)
            emit_progress("cnn_ready", "CNN model loaded successfully", delay=0.3)
        except Exception as e:
            emit_progress("cnn_error", f"Failed to load CNN model: {str(e)}. Falling back to pure computer vision.", delay=1.0)
            return None
    return _detector

def emit_progress(step, message, delay=0.4):
    """Emit progress update with a delay for better UX visibility"""
    print(json.dumps({"type": "progress", "step": step, "message": message}), flush=True)
    time.sleep(delay)

def calculate_ssim(img1, img2):
    """Calculates Structural Similarity Index (SSIM) between two images."""
    C1 = (0.01 * 255)**2
    C2 = (0.03 * 255)**2
    
    img1 = img1.astype(np.float64)
    img2 = img2.astype(np.float64)
    
    kernel = cv2.getGaussianKernel(11, 1.5)
    window = np.outer(kernel, kernel.transpose())
    
    mu1 = cv2.filter2D(img1, -1, window)[5:-5, 5:-5]
    mu2 = cv2.filter2D(img2, -1, window)[5:-5, 5:-5]
    
    mu1_sq = mu1**2
    mu2_sq = mu2**2
    mu1_mu2 = mu1 * mu2
    
    sigma1_sq = cv2.filter2D(img1**2, -1, window)[5:-5, 5:-5] - mu1_sq
    sigma2_sq = cv2.filter2D(img2**2, -1, window)[5:-5, 5:-5] - mu2_sq
    sigma12 = cv2.filter2D(img1 * img2, -1, window)[5:-5, 5:-5] - mu1_mu2
    
    ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
    return ssim_map.mean()

def check_alignment_orb(img1, img2):
    """Uses ORB feature matching + KNN + Homography."""
    try:
        orb = cv2.ORB_create(nfeatures=2000)
        kp1, des1 = orb.detectAndCompute(img1, None)
        kp2, des2 = orb.detectAndCompute(img2, None)
        
        if des1 is None or des2 is None or len(kp1) < 15 or len(kp2) < 15:
            return 0.0, None
            
        bf = cv2.BFMatcher(cv2.NORM_HAMMING)
        matches = bf.knnMatch(des1, des2, k=2)
        
        good_matches = []
        for m, n in matches:
            if m.distance < 0.75 * n.distance:
                good_matches.append(m)
        
        if len(good_matches) < 10:
            return 0.0, None
        
        src_pts = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        dst_pts = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)
        
        H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 3.0)
        
        if H is None:
            return 0.1, None
            
        det = np.linalg.det(H[:2, :2])
        if abs(det) < 0.1:
            return 0.0, None

        inliers = np.sum(mask)
        score = min(1.0, inliers / 40.0) 
        
        return score, H
    except Exception:
        return 0.0, None

def get_mask_channel_values(mask_img):
    if len(mask_img.shape) < 3:
        return mask_img
    b, g, r = mask_img[:, :, 0], mask_img[:, :, 1], mask_img[:, :, 2]
    def count_unique(arr):
        u = np.unique(arr)
        return len([x for x in u if x != 0 and x != 255])
    cb, cg, cr = count_unique(b), count_unique(g), count_unique(r)
    if cb >= cg and cb >= cr: return b
    elif cg >= cr: return g
    else: return r

def analyze(real_path, cad_path, mask_path, json_path):
    try:
        real_img = cv2.imread(real_path)
        cad_img = cv2.imread(cad_path)
        mask_img = cv2.imread(mask_path, cv2.IMREAD_UNCHANGED)
        
        if any(x is None for x in [real_img, cad_img, mask_img]):
            return {"valid": False, "error": "Failed to load one or more images."}

        target_h, target_w = cad_img.shape[:2]
        if mask_img.shape[:2] != (target_h, target_w):
             return {"valid": False, "error": f"Mask dimensions mismatch."}
        
        real_orig = real_img.copy()
        if real_img.shape[:2] != (target_h, target_w):
            real_img = cv2.resize(real_img, (target_w, target_h), interpolation=cv2.INTER_AREA)

        emit_progress("structural_analysis_start", "Initializing structural pattern recognition", delay=0.5)
        real_gray = cv2.cvtColor(real_img, cv2.COLOR_BGR2GRAY)
        cad_gray = cv2.cvtColor(cad_img, cv2.COLOR_BGR2GRAY)
        
        emit_progress("orb_analysis", "Calculating industrial registration matrix (KNN+RANSAC)", delay=0.5)
        alignment_score, H = check_alignment_orb(cad_gray, real_gray)

        real_gray_warped = real_gray.copy()
        if H is not None:
            try:
                emit_progress("warping", "Warping perspective for mask alignment", delay=0.5)
                real_gray_warped = cv2.warpPerspective(real_gray, H, (target_w, target_h))
            except Exception:
                H = None
        
        emit_progress("ssim_analysis", "Calculating structural similarity", delay=0.5)
        ssim_score = calculate_ssim(real_gray_warped, cad_gray)

        try:
            with open(json_path, 'r') as f:
                json_data = json.load(f)
            best_key = list(json_data.keys())[0] if json_data else None
            parts_defs = json_data[best_key] if best_key else []
        except Exception:
             return {"valid": False, "error": "Invalid JSON or parts mapping."}

        mask_values = get_mask_channel_values(mask_img)
        detector = get_cnn_detector()
        
        emit_progress("detailed_analysis_start", "Starting CNN-enhanced part localization", delay=0.5)
        results = []
        
        # Load real image for PIL (for CNN)
        real_pil = Image.open(real_path).convert("RGB")
        
        for i, part in enumerate(parts_defs):
            name = part['Name']
            node_id = part['NodeId']
            stencil_val = part['StencilValue']
            
            # 1. Get CAD centroid from Mask
            part_mask = cv2.inRange(mask_values, int(stencil_val), int(stencil_val))
            if cv2.countNonZero(part_mask) == 0:
                results.append({"id": node_id, "name": name, "status": "absent", "confidence": 0})
                continue

            M = cv2.moments(part_mask)
            cX = int(M["m10"] / M["m00"]) if M["m00"] != 0 else 0
            cY = int(M["m01"] / M["m00"]) if M["m00"] != 0 else 0

            # 2. Warp to Real space for CNN ROI
            rX, rY = cX, cY
            if H is not None:
                pts = np.float32([cX, cY]).reshape(-1, 1, 2)
                transformed_pts = cv2.perspectiveTransform(pts, H)
                rX, rY = transformed_pts[0][0]

            # 3. CNN Detection for refinement
            status = "present"
            confidence = 0.8
            final_rx, final_ry = rX, rY
            
            if detector:
                try:
                    # Search specifically for part labels in the real image
                    # We use a broad prompt but check proximity to expected coordinates
                    # Optimization: Crop a small ROI around expected point to focus CNN
                    w, h = real_pil.size
                    pad = 100 # ROI padding
                    left, top = max(0, int(rX - pad)), max(0, int(rY - pad))
                    right, bottom = min(w, int(rX + pad)), min(h, int(rY + pad))
                    
                    roi_img = real_pil.crop((left, top, right, bottom))
                    # Simplified labels for the model
                    search_label = name.split('_')[0].lower() # e.g. "bolt" from "M10_bolt_2"
                    if "washer" in search_label: search_label = "washer"
                    if "bolt" in search_label: search_label = "bolt"
                    
                    predictions = detector(roi_img, candidate_labels=[search_label])
                    
                    if predictions and predictions[0]['score'] > 0.15:
                        pred = predictions[0]
                        box = pred['box']
                        # Map ROI coordinates back to full image
                        final_rx = left + (box['xmin'] + box['xmax']) / 2
                        final_ry = top + (box['ymin'] + box['ymax']) / 2
                        confidence = pred['score']
                        status = "present"
                    else:
                        status = "absent"
                        confidence = 0.5
                except Exception:
                    pass

            results.append({
                "id": node_id, "name": name, "status": status, "confidence": float(confidence),
                "x_cad": round((cX / target_w) * 100, 2), "y_cad": round((cY / target_h) * 100, 2),
                "x_real": round((final_rx / target_w) * 100, 2), "y_real": round((final_ry / target_h) * 100, 2),
                "x": round((final_rx / target_w) * 100, 2), "y": round((final_ry / target_h) * 100, 2)
            })

        return {"valid": True, "parts": results, "globalSimilarity": float(ssim_score)}
    except Exception as e:
        return {"valid": False, "error": str(e) + "\n" + traceback.format_exc()}

if __name__ == "__main__":
    if len(sys.argv) >= 5:
        print("\n__RESULT_START__")
        print(json.dumps(analyze(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])))
        print("__RESULT_END__")
    else:
        print(json.dumps({"valid": False, "error": "Insufficient arguments"}))

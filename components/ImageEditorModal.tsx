import React, { useState, useRef, useEffect } from 'react';

interface ImageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (croppedImage: string) => void;
    imageSrc: string;
}

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({ isOpen, onClose, onSave, imageSrc }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(new Image());
    const containerRef = useRef<HTMLDivElement>(null);
    
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const CROP_SIZE = 300; // The size of the canvas and crop area

    useEffect(() => {
        const image = imageRef.current;
        image.src = imageSrc;
        image.onload = () => {
            // Reset state when new image is loaded
            const { width, height } = image;
            if (width === 0 || height === 0) return;

            // Calculate initial zoom to make the image 'cover' the square crop area
            const widthRatio = CROP_SIZE / width;
            const heightRatio = CROP_SIZE / height;
            const initialZoom = Math.max(widthRatio, heightRatio);
            
            setZoom(initialZoom);
            setOffset({ x: 0, y: 0 }); // Center the image
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [imageSrc]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const newZoom = zoom - e.deltaY * 0.001;
        setZoom(Math.max(0.1, newZoom)); // Prevent zooming out too much
    };
    
    const handleSave = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image.src || image.width === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.clearRect(0, 0, CROP_SIZE, CROP_SIZE);
        
        const scaledWidth = image.width * zoom;
        const scaledHeight = image.height * zoom;
        
        // Position of the top-left corner of the scaled image relative to the container's center
        const imagePosX = -scaledWidth / 2 + offset.x;
        const imagePosY = -scaledHeight / 2 + offset.y;
        
        // Position of the top-left corner of the crop area relative to the container's center
        const cropPosX = -CROP_SIZE / 2;
        const cropPosY = -CROP_SIZE / 2;

        // Calculate the source rectangle (sx, sy, sWidth, sHeight) on the original image
        const sx = (cropPosX - imagePosX) / zoom;
        const sy = (cropPosY - imagePosY) / zoom;
        const sWidth = CROP_SIZE / zoom;
        const sHeight = CROP_SIZE / zoom;

        ctx.drawImage(
            image,
            sx, sy,
            sWidth, sHeight,
            0, 0,
            CROP_SIZE, CROP_SIZE
        );

        onSave(canvas.toDataURL('image/png'));
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Edit Reward Image</h2>
                <p className="text-slate-500 mb-4 text-sm">Zoom and drag the image to frame the perfect reward picture.</p>
                
                <div 
                    ref={containerRef}
                    className="relative w-full h-80 bg-slate-200 rounded-lg overflow-hidden cursor-move mb-4 touch-none"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    <img
                        src={imageSrc}
                        alt="Editable reward"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                            willChange: 'transform'
                        }}
                    />
                    {/* Visual Crop Guide Overlay */}
                    <div 
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{
                            width: CROP_SIZE,
                            height: CROP_SIZE,
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                            border: '2px dashed white',
                        }}
                    />
                </div>
                
                 <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-slate-600">Zoom</span>
                    <input
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.01"
                        value={zoom}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>

                <canvas ref={canvasRef} width={CROP_SIZE} height={CROP_SIZE} className="hidden" />

                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="font-bold text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-200 transition">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="font-bold text-white bg-purple-500 px-4 py-2 rounded-lg hover:bg-purple-600 transition shadow-md">
                        Save Image
                    </button>
                </div>
            </div>
        </div>
    );
};
import React from 'react';

interface ImageModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
}

const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen || !imageUrl) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 md:-right-12 text-white hover:text-primary transition-colors flex items-center gap-2 font-black text-xs uppercase tracking-widest bg-slate-800/50 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10"
                >
                    <span className="material-symbols-outlined">close</span>
                    Fechar
                </button>

                <div className="bg-white p-2 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                    <img
                        src={imageUrl}
                        alt="Imagem em tamanho real"
                        className="max-w-full max-h-[80vh] object-contain rounded-xl"
                    />
                </div>
            </div>
        </div>
    );
};

export default ImageModal;

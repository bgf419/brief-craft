"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Video,
  ImageIcon,
  Plus,
  Clock,
  Tag,
  Link2,
  Loader2,
  Trash2,
  GripVertical,
} from "lucide-react";
import toast from "react-hot-toast";
import Button from "./Button";

interface VideoItem {
  id: string;
  url: string;
  title: string;
  annotations: { id: string; timestamp: string; note: string }[];
}

interface ImageItem {
  id: string;
  url: string;
  tags: string[];
  order: number;
}

interface MediaPanelProps {
  rowId?: string;
  isOpen: boolean;
  onClose: () => void;
}

function getEmbedUrl(url: string): { type: "iframe" | "video"; src: string } {
  if (url.includes("youtube.com") || url.includes("youtu.be")) {
    const id = url.includes("youtu.be")
      ? url.split("/").pop()
      : new URLSearchParams(new URL(url).search).get("v");
    return { type: "iframe", src: `https://www.youtube.com/embed/${id}` };
  }
  if (url.includes("vimeo.com")) {
    const id = url.split("/").pop();
    return { type: "iframe", src: `https://player.vimeo.com/video/${id}` };
  }
  return { type: "video", src: url };
}

export default function MediaPanel({
  rowId,
  isOpen,
  onClose,
}: MediaPanelProps) {
  const [tab, setTab] = useState<"videos" | "images">("videos");
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Video form
  const [videoUrl, setVideoUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);

  // Annotation form
  const [annotationVideoId, setAnnotationVideoId] = useState<string | null>(null);
  const [annotationTimestamp, setAnnotationTimestamp] = useState("");
  const [annotationNote, setAnnotationNote] = useState("");

  // Image form
  const [imageUrl, setImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetchMedia();
  }, [isOpen, rowId]);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const params = rowId ? `?rowId=${rowId}` : "";
      const res = await fetch(`/api/assets${params}`);
      if (res.ok) {
        const assets = await res.json();
        setVideos(
          assets
            .filter((a: { type: string }) => a.type === "video")
            .map((a: { id: string; url: string; name?: string; note?: string }) => ({
              id: a.id,
              url: a.url,
              title: a.name || a.url,
              annotations: a.note ? JSON.parse(a.note) : [],
            }))
        );
        setImages(
          assets
            .filter((a: { type: string }) => a.type === "image")
            .map((a: { id: string; url: string; tags?: string }) => ({
              id: a.id,
              url: a.url,
              tags: a.tags ? JSON.parse(a.tags) : [],
              order: 0,
            }))
        );
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const addVideo = async () => {
    if (!videoUrl.trim()) return;
    setAddingVideo(true);
    try {
      const url = videoUrl.trim();
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: url,
          url,
          type: "video",
          note: "[]",
          rowId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setVideos((prev) => [
          ...prev,
          {
            id: data.id,
            url: data.url,
            title: data.name || data.url,
            annotations: [],
          },
        ]);
        setVideoUrl("");
        toast.success("Video added");
      }
    } catch {
      toast.error("Failed to add video");
    } finally {
      setAddingVideo(false);
    }
  };

  const addAnnotation = async (videoId: string) => {
    if (!annotationTimestamp.trim() || !annotationNote.trim()) return;
    try {
      const video = videos.find((v) => v.id === videoId);
      if (!video) return;
      const newAnnotation = {
        id: crypto.randomUUID(),
        timestamp: annotationTimestamp.trim(),
        note: annotationNote.trim(),
      };
      const updatedAnnotations = [...video.annotations, newAnnotation];
      const res = await fetch(`/api/assets/${videoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: JSON.stringify(updatedAnnotations) }),
      });
      if (res.ok) {
        setVideos((prev) =>
          prev.map((v) =>
            v.id === videoId
              ? { ...v, annotations: updatedAnnotations }
              : v
          )
        );
        setAnnotationTimestamp("");
        setAnnotationNote("");
        setAnnotationVideoId(null);
        toast.success("Annotation added");
      }
    } catch {
      toast.error("Failed to add annotation");
    }
  };

  const addImage = async () => {
    if (!imageUrl.trim()) return;
    setAddingImage(true);
    try {
      const url = imageUrl.trim();
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: url,
          url,
          type: "image",
          tags: [],
          rowId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setImages((prev) => [
          ...prev,
          {
            id: data.id,
            url: data.url,
            tags: data.tags ? JSON.parse(data.tags) : [],
            order: 0,
          },
        ]);
        setImageUrl("");
        toast.success("Image added");
      }
    } catch {
      toast.error("Failed to add image");
    } finally {
      setAddingImage(false);
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      await fetch(`/api/assets/${id}`, { method: "DELETE" });
      setVideos((prev) => prev.filter((v) => v.id !== id));
      toast.success("Video removed");
    } catch {
      toast.error("Failed to remove video");
    }
  };

  const deleteImage = async (id: string) => {
    try {
      await fetch(`/api/assets/${id}`, { method: "DELETE" });
      setImages((prev) => prev.filter((i) => i.id !== id));
      toast.success("Image removed");
    } catch {
      toast.error("Failed to remove image");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-[480px] bg-white border-l border-[#dadce0] z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#dadce0]">
        <h3 className="text-sm font-semibold text-[#202124]">Media</h3>
        <button
          onClick={onClose}
          className="p-1 rounded text-[#80868b] hover:text-[#202124] hover:bg-[#f1f3f4] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#dadce0]">
        <button
          onClick={() => setTab("videos")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2 ${
            tab === "videos"
              ? "border-[#1a73e8] text-[#1a73e8]"
              : "border-transparent text-[#5f6368] hover:text-[#202124]"
          }`}
        >
          <Video className="h-4 w-4" />
          Videos
        </button>
        <button
          onClick={() => setTab("images")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-medium transition-colors border-b-2 ${
            tab === "images"
              ? "border-[#1a73e8] text-[#1a73e8]"
              : "border-transparent text-[#5f6368] hover:text-[#202124]"
          }`}
        >
          <ImageIcon className="h-4 w-4" />
          Images
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#80868b]" />
          </div>
        )}

        {/* Videos tab */}
        {tab === "videos" && !loading && (
          <>
            {/* Add video */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#80868b]" />
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="YouTube, Vimeo, or direct URL..."
                  className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-lg pl-8 pr-3 py-2 text-sm text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#1a73e8] focus:bg-white transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && addVideo()}
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                loading={addingVideo}
                onClick={addVideo}
              >
                Add
              </Button>
            </div>

            {/* Video list */}
            {videos.map((video) => {
              const embed = getEmbedUrl(video.url);
              return (
                <div
                  key={video.id}
                  className="bg-[#f8f9fa] border border-[#dadce0] rounded-xl overflow-hidden"
                >
                  {/* Preview */}
                  <div className="aspect-video bg-black">
                    {embed.type === "iframe" ? (
                      <iframe
                        src={embed.src}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                        allowFullScreen
                      />
                    ) : (
                      <video
                        src={embed.src}
                        controls
                        className="w-full h-full"
                      />
                    )}
                  </div>

                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-[#5f6368] truncate flex-1">
                        {video.url}
                      </p>
                      <button
                        onClick={() => deleteVideo(video.id)}
                        className="p-1 rounded text-[#80868b] hover:text-[#d93025] transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Annotations */}
                    <div className="space-y-1.5">
                      {video.annotations.map((ann) => (
                        <div
                          key={ann.id}
                          className="flex items-start gap-2 text-xs"
                        >
                          <span className="flex items-center gap-1 text-[#1a73e8] font-mono flex-shrink-0">
                            <Clock className="h-3 w-3" />
                            {ann.timestamp}
                          </span>
                          <span className="text-[#5f6368]">{ann.note}</span>
                        </div>
                      ))}
                    </div>

                    {annotationVideoId === video.id ? (
                      <div className="mt-2 space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={annotationTimestamp}
                            onChange={(e) =>
                              setAnnotationTimestamp(e.target.value)
                            }
                            placeholder="0:00"
                            className="w-16 bg-white border border-[#dadce0] rounded px-2 py-1 text-xs text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#1a73e8]"
                          />
                          <input
                            type="text"
                            value={annotationNote}
                            onChange={(e) =>
                              setAnnotationNote(e.target.value)
                            }
                            placeholder="Note..."
                            className="flex-1 bg-white border border-[#dadce0] rounded px-2 py-1 text-xs text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#1a73e8]"
                            onKeyDown={(e) =>
                              e.key === "Enter" &&
                              addAnnotation(video.id)
                            }
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => addAnnotation(video.id)}
                          >
                            Add
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAnnotationVideoId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAnnotationVideoId(video.id)}
                        className="mt-2 flex items-center gap-1.5 text-xs text-[#80868b] hover:text-[#1a73e8] transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Add timestamp
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {!loading && videos.length === 0 && (
              <p className="text-center text-xs text-[#80868b] py-8">
                No videos yet. Add one above.
              </p>
            )}
          </>
        )}

        {/* Images tab */}
        {tab === "images" && !loading && (
          <>
            {/* Add image */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#80868b]" />
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Image URL..."
                  className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-lg pl-8 pr-3 py-2 text-sm text-[#202124] placeholder-[#80868b] focus:outline-none focus:border-[#1a73e8] focus:bg-white transition-colors"
                  onKeyDown={(e) => e.key === "Enter" && addImage()}
                />
              </div>
              <Button
                variant="primary"
                size="sm"
                loading={addingImage}
                onClick={addImage}
              >
                Add
              </Button>
            </div>

            {/* Image grid */}
            <div className="grid grid-cols-2 gap-3">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="relative group bg-[#f8f9fa] border border-[#dadce0] rounded-xl overflow-hidden hover:border-[#1a73e8] transition-colors"
                >
                  <div className="aspect-square relative">
                    <img
                      src={image.url}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23f1f3f4' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' fill='%2380868b' font-size='12'%3ENo image%3C/text%3E%3C/svg%3E";
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button className="p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors">
                        <GripVertical className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteImage(image.id)}
                        className="p-1.5 rounded-lg bg-black/60 text-[#d93025] hover:bg-black/80 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {image.tags.length > 0 && (
                    <div className="p-2 flex flex-wrap gap-1">
                      {image.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#e8f0fe] text-[10px] text-[#1a73e8]"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!loading && images.length === 0 && (
              <p className="text-center text-xs text-[#80868b] py-8">
                No images yet. Add one above.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

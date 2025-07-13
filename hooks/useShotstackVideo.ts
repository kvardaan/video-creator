import { useEffect, useState } from "react";

import { uploadImageToCloudinary } from "@/lib/utils";

const SHOTSTACK_API_KEY = process.env.EXPO_PUBLIC_SHOTSTACK_API_KEY;
const SHOTSTACK_API_URL = `https://api.shotstack.io/edit/stage`;

async function createVideo(imageUrls: string[], audioUrl: string) {
	const timeline = {
		tracks: [
			{
				clips: imageUrls.map((url, idx) => ({
					asset: { type: "image", src: url },
					start: idx * 3,
					length: 3,
					effect: "slideLeft",
					transition: {
						in: "fade",
					},
					position: "center",
				})),
			},
			{
				clips: [
					{
						asset: { type: "audio", src: audioUrl },
						start: 0,
						length: imageUrls.length * 3,
					},
				],
			},
		],
	};

	const payload = {
		timeline,
		output: { format: "mp4", fps: 30, resolution: "sd" },
	};

	const res = await fetch(`${SHOTSTACK_API_URL}/render`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"x-api-key": SHOTSTACK_API_KEY,
		},
		body: JSON.stringify(payload),
	});
	const json = await res.json();
	return json.response.id;
}

async function pollStatus(renderId: string): Promise<string | null> {
	const res = await fetch(`${SHOTSTACK_API_URL}/render/${renderId}`, {
		headers: { "x-api-key": SHOTSTACK_API_KEY },
	});
	const json = await res.json();
	const status = json.response.status;
	if (status === "done") return json.response.url;
	if (status === "failed") throw new Error("Render failed");
	return null;
}

export function useShotstackVideo(imageUris: string[], audioUrl: string, cloudName: string, uploadPreset: string) {
	const [videoUrl, setVideoUrl] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (imageUris.length === 0 || !audioUrl || !cloudName || !uploadPreset) return;

		(async () => {
			setLoading(true);

			const imageUrls: string[] = [];
			for (const uri of imageUris) {
				const url = await uploadImageToCloudinary(uri, cloudName, uploadPreset);
				imageUrls.push(url);
			}

			const renderId = await createVideo(imageUrls, audioUrl);
			let finalUrl: string | null = null;
			for (let i = 0; i < 20 && !finalUrl; i++) {
				await new Promise((r) => setTimeout(r, 8000));
				finalUrl = await pollStatus(renderId);
			}
			setVideoUrl(finalUrl);
			setLoading(false);
		})();
	}, [imageUris, audioUrl, cloudName, uploadPreset]);

	return { videoUrl, loading };
}

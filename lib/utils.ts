import * as FileSystem from "expo-file-system";

export async function uploadImageToCloudinary(uri: string, cloudName: string, uploadPreset: string): Promise<string> {
	const base64 = await FileSystem.readAsStringAsync(uri, {
		encoding: FileSystem.EncodingType.Base64,
	});

	const formData = new FormData();
	formData.append("file", `data:image/jpeg;base64,${base64}`);
	formData.append("upload_preset", uploadPreset);

	const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
		method: "POST",
		body: formData,
	});

	const json = await res.json();
	return json.secure_url;
}

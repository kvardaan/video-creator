import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useShotstackVideo } from "@/hooks/useShotstackVideo";

const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const uploadPreset = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

export default function Index() {
	const [imageUris, setImageUris] = useState<string[]>([]);

	const pickImages = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsMultipleSelection: true,
			aspect: [4, 3],
			quality: 1,
			selectionLimit: 5,
		});

		if (!result.canceled) {
			const uris = result.assets.map((asset) => asset.uri);
			setImageUris(uris);
		}
	};

	const audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3";

	const { videoUrl, loading } = useShotstackVideo(imageUris, audioUrl, cloudName, uploadPreset);

	const saveToGallery = async () => {
		if (!videoUrl) return;
		const permission = await MediaLibrary.requestPermissionsAsync();
		if (!permission.granted) {
			Alert.alert("Permission denied", "Cannot save video without media library access.");
			return;
		}

		const downloadPath = FileSystem.documentDirectory + "rendered-video.mp4";
		const { uri } = await FileSystem.downloadAsync(videoUrl, downloadPath);
		await MediaLibrary.saveToLibraryAsync(uri);
		Alert.alert("Success", "Video saved to gallery!");
	};

	return (
		<SafeAreaView style={styles.container}>
			<Stack.Screen options={{ headerShown: false }} />

			{imageUris.length === 0 && (
				<Pressable onPress={pickImages} style={styles.cta}>
					<Text style={styles.ctaText}>Pick Images</Text>
				</Pressable>
			)}

			{loading && <ActivityIndicator size="large" />}

			{videoUrl && (
				<View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 20 }}>
					<Video
						source={{ uri: videoUrl }}
						useNativeControls
						resizeMode={ResizeMode.CONTAIN}
						style={styles.video}
						isLooping
					/>
					<Text style={styles.message}>Click to play the video</Text>
					<Pressable onPress={saveToGallery} style={styles.cta}>
						<Text style={styles.ctaText}>Save to Gallery</Text>
					</Pressable>
				</View>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		paddingVertical: 10,
	},
	cta: {
		backgroundColor: "orange",
		padding: 10,
		borderRadius: 5,
	},
	ctaText: {
		color: "white",
		fontWeight: "bold",
		fontSize: 16,
	},
	imageContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		justifyContent: "center",
	},
	image: {
		width: 100,
		height: 100,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#00000025",
	},
	message: {
		fontSize: 16,
		color: "gray",
	},
	video: {
		width: 300,
		height: 300,
		borderRadius: 10,
	},
});

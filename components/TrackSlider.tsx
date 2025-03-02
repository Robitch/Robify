import Slider from '@react-native-community/slider';
import React from 'react';
import { Dimensions, Platform } from 'react-native';
import { useAudioStore } from '~/store/audio';

const TrackSlider = ({ className }: { className?: string }) => {
    const { position, duration, setPositionAsync } = useAudioStore();

    const handleSlidingComplete = async (value: number) => {
        console.log('duration', duration);
        console.log('current pos ', position);
        console.log('Seeking to ', value);
        await setPositionAsync(value);
    };
    return (
        <Slider
            style={{
                marginLeft: Platform.select({ ios: 0, android: -15 }),
                marginRight: Platform.select({ ios: 0, android: -15 }),
                borderRadius: 10,
            }}
            minimumValue={0}
            maximumValue={duration || 1}
            value={position || 0}
            minimumTrackTintColor="#fff"
            maximumTrackTintColor="#f2f2f2"
            thumbTintColor="#fff"
            onSlidingComplete={handleSlidingComplete}
            step={1}
        />
    );
};



export default TrackSlider;

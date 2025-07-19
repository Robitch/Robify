import React, { useEffect } from 'react';
import { Pressable, Animated, View } from 'react-native';
import { useColorScheme } from '~/lib/useColorScheme';

interface AnimatedButtonProps {
    children: React.ReactNode;
    onPress?: () => void;
    disabled?: boolean;
    style?: any;
    variant?: 'primary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export function AnimatedButton({ 
    children, 
    onPress, 
    disabled = false, 
    style,
    variant = 'primary',
    size = 'md'
}: AnimatedButtonProps) {
    const { isDarkColorScheme } = useColorScheme();
    const scaleAnim = new Animated.Value(1);
    const opacityAnim = new Animated.Value(1);

    const handlePressIn = () => {
        if (disabled) return;
        
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 0.95,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }),
            Animated.timing(opacityAnim, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handlePressOut = () => {
        if (disabled) return;

        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                tension: 300,
                friction: 10,
            }),
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const getButtonStyle = () => {
        const baseStyle = {
            borderRadius: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
            paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
            paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 24 : 16,
            alignItems: 'center' as const,
            justifyContent: 'center' as const,
        };

        switch (variant) {
            case 'primary':
                return {
                    ...baseStyle,
                    backgroundColor: disabled 
                        ? (isDarkColorScheme ? '#374151' : '#d1d5db')
                        : '#10b981',
                };
            case 'outline':
                return {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderColor: disabled 
                        ? (isDarkColorScheme ? '#374151' : '#d1d5db')
                        : (isDarkColorScheme ? '#6b7280' : '#9ca3af'),
                };
            case 'ghost':
                return {
                    ...baseStyle,
                    backgroundColor: 'transparent',
                };
            default:
                return baseStyle;
        }
    };

    return (
        <Animated.View
            style={[
                {
                    transform: [{ scale: scaleAnim }],
                    opacity: disabled ? 0.5 : opacityAnim,
                },
                style
            ]}
        >
            <Pressable
                style={getButtonStyle()}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
            >
                {children}
            </Pressable>
        </Animated.View>
    );
}
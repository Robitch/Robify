import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from '~/components/ui/text';
import { Input } from '~/components/ui/input';
import { Link } from 'expo-router';
import { Button } from '~/components/ui/button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

type RegisterFormData = {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
};

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const [isLoading, setIsLoading] = useState(false);
    const { control, handleSubmit, formState: { errors }, watch } = useForm<RegisterFormData>();
    const password = watch("password");

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            // Replace with your actual registration logic
            console.log('Register data:', data);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // After successful registration
            router.replace('/home');
        } catch (error) {
            console.error('Registration failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center px-6" style={{
            paddingTop: insets.top + 80,
            paddingBottom: insets.bottom + 25,
        }}>
            <View className="my-20 gap-5">
                {/* Title */}
                <Text className="text-3xl font-bold text-center">Register</Text>
                {/* Subtitle */}
                <Text className="text-center text-foreground">Create an account to enjoy music</Text>
            </View>

            {/* Form */}

            {/* <KeyboardAwareScrollView
                // behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="gap-5"
            > */}
            <View className='gap-5'>
                <Controller
                    control={control}
                    rules={{
                        required: 'Name is required',
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                            <Input
                                className={errors.name ? 'border-red-500' : ''}
                                placeholder="Name"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                            />
                            {errors.name && (
                                <Text className="text-red-700 mt-1">{errors.name.message}</Text>
                            )}
                        </View>
                    )}
                    name="name"
                />

                <Controller
                    control={control}
                    rules={{
                        required: 'Email is required',
                        pattern: {
                            value: /^\S+@\S+\.\S+$/,
                            message: 'Please enter a valid email',
                        },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                            <Input
                                className={errors.email ? 'border-red-500' : ''}
                                placeholder="Email"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            {errors.email && (
                                <Text className="text-red-500 mt-1">{errors.email.message}</Text>
                            )}
                        </View>
                    )}
                    name="email"
                />

                <Controller
                    control={control}
                    rules={{
                        required: 'Password is required',
                        minLength: {
                            value: 6,
                            message: 'Password must be at least 6 characters',
                        },
                    }}
                    render={({ field: { onChange, onBlur, value } }) => (
                        <View>
                            <Input
                                className={errors.password ? 'border-red-500' : ''}
                                placeholder="Password"
                                onBlur={onBlur}
                                onChangeText={onChange}
                                value={value}
                                secureTextEntry
                            />
                            {errors.password && (
                                <Text className="text-red-500 mt-1">{errors.password.message}</Text>
                            )}
                        </View>
                    )}
                    name="password"
                />

            </View>

            {/* Button submit */}
            {/* <Link href="/choose-theme" asChild> */}
            <Button className="w-full my-10" style={{ height: 92, borderRadius: 30 }} disabled={isLoading} onPress={handleSubmit(onSubmit)}>
                {isLoading ? (
                    <ActivityIndicator color="white" />
                ) : (
                    <Text className="text-foreground" style={{ fontSize: 21, fontWeight: "bold" }}>Get Started</Text>
                )}
            </Button>
            {/* </Link> */}

            {/* Divider */}
            {/* <View className="flex-row items-center gap-5">
                <View className="flex-1 border-t border-muted-foreground" />
                <Text className="text-muted-foreground text-md">Or</Text>
                <View className="flex-1 border-t border-muted-foreground" />
            </View> */}

            {/* //TODO Google / Apple authentication */}

            {/* Link to login page */}
            <View className="flex-row justify-center">
                <Text className="text-gray-600">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.replace('/login')}>
                    <Text className="text-blue-500 font-semibold">Sign In</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
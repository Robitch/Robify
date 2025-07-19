import * as React from 'react';
import { TextInput, View, TouchableOpacity, type TextInputProps, Text } from 'react-native';
import { cn } from '~/lib/utils';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '~/lib/useColorScheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, placeholderClassName, secureTextEntry, label, error, helper, leftIcon, rightIcon, onRightIconPress, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(!secureTextEntry);
    const [isFocused, setIsFocused] = React.useState(false);
    const { isDarkColorScheme } = useColorScheme();

    const borderColor = error
      ? '#ef4444'
      : isFocused
        ? '#10b981'
        : isDarkColorScheme
          ? '#374151'
          : '#e5e7eb';

    return (
      <View className="w-full">
        {label && (
          <Text className="text-sm font-medium text-foreground mb-2">
            {label}
          </Text>
        )}
        <View
          style={{
            position: 'relative',
            borderWidth: 1.5,
            borderColor,
            borderRadius: 12,
            backgroundColor: isDarkColorScheme ? '#1f2937' : '#ffffff',
          }}
          className="flex-row items-center"
        >
          {leftIcon && (
            <View className="pl-4">
              <Ionicons
                name={leftIcon as any}
                size={20}
                className={`text-${isDarkColorScheme ? '9ca3af' : '6b7280'}`}
              />
            </View>
          )}
          <TextInput
            ref={ref}
            className={cn(
              'flex-1 py-4 text-base text-foreground',
              leftIcon ? 'pl-3' : 'pl-4',
              (secureTextEntry || rightIcon || onRightIconPress) ? 'pr-3' : 'pr-4',
              props.editable === false && 'opacity-50',
              className
            )}
            style={{
              fontSize: 16,
              color: isDarkColorScheme ? '#f9fafb' : '#111827',
            }}
            placeholderTextColor={isDarkColorScheme ? '#6b7280' : '#9ca3af'}
            secureTextEntry={secureTextEntry && !isPasswordVisible}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          {(secureTextEntry || rightIcon || onRightIconPress) && (
            <TouchableOpacity
              className="pr-4"
              onPress={secureTextEntry ? () => setIsPasswordVisible(!isPasswordVisible) : onRightIconPress}
            >
              <Ionicons
                name={
                  secureTextEntry
                    ? (isPasswordVisible ? 'eye-off' : 'eye')
                    : (rightIcon as any)
                }
                size={20}
                className={`text-${isDarkColorScheme ? '9ca3af' : '6b7280'}`}
              />
            </TouchableOpacity>
          )}
        </View>
        {(error || helper) && (
          <Text className={cn(
            'text-sm mt-1',
            error ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {error || helper}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input, type InputProps };

import * as React from 'react';
import { TextInput, View, TouchableOpacity, type TextInputProps } from 'react-native';
import { cn } from '~/lib/utils';
import { Ionicons } from '@expo/vector-icons';

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, TextInputProps>(
  ({ className, placeholderClassName, secureTextEntry, ...props }, ref) => {
    const [isPasswordVisible, setIsPasswordVisible] = React.useState(!secureTextEntry);

    return (
      <View style={{ position: 'relative', width: '100%' }}>
        <TextInput
          ref={ref}
          className={cn(
            'web:flex  web:w-full rounded-[2rem] border border-input bg-background py-10 px-7  web:py-2 text-base lg:text-sm native:text-lg native:leading-[1.25] text-foreground placeholder:font-semibold placeholder:text-muted-foreground web:ring-offset-background file:border-0 file:bg-transparent file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
            props.editable === false && 'opacity-50 web:cursor-not-allowed',
            className
          )}
          placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
          secureTextEntry={!isPasswordVisible}
          {...props}
        />
        {secureTextEntry && (
          <TouchableOpacity
            style={{ position: 'absolute', right: 20, top: '50%', transform: [{ translateY: -12 }] }}
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            <Ionicons name={isPasswordVisible ? 'eye-off' : 'eye'} size={24} className='text-muted-foreground' />
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };

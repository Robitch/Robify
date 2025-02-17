// Profile page

import { View, Text } from "react-native";
import { useAuth } from "@/provider/AuthProvider";
import { Button } from "@/components/ui/button";

export default function Profile() {
    const { user, signOut } = useAuth();
    return (
        <View>
            <Text>Profile</Text>
            <Text>{user?.email}</Text>
            <Button className="bg-red-500" onPress={signOut}><Text>Sign out</Text></Button>
        </View>
    )
}

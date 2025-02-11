import { useState } from "react";
import { AppState, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { H1, P } from "./ui/typography";
import { Link } from "expo-router";
import { Text } from "./ui/text";
import Apple from "~/lib/icons/Apple";

import Google from "~/lib/icons/Google";
import Meta from "~/lib/icons/Meta";

// // Gestion du rafraîchissement automatique de la session Supabase
// AppState.addEventListener("change", (state) => {
//   if (state === "active") {
//     supabase.auth.startAutoRefresh();
//   } else {
//     supabase.auth.stopAutoRefresh();
//   }
// });

export function LoginForm() {
  const [email, setEmail] = useState("test@test.com");
  const [password, setPassword] = useState("testtest14");
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");


  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setAlertMessage(error.message);
      setAlertVisible(true);
    }
    setLoading(false);
  }



  return (
    <View className="flex-col gap-6">
      {/* AlertDialog */}
      <AlertDialog open={alertVisible} onOpenChange={setAlertVisible}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Error</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>{alertMessage}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction onPress={() => setAlertVisible(false)}>
              <Text>OK</Text>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Formulaire de connexion */}
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <View className="p-6 md:p-8">
            <View className="flex-col gap-6">
              <View className="flex-col items-center text-center">
                <H1 className="text-2xl font-bold">Welcome back</H1>
                <P className="text-balance text-muted-foreground">
                  Login to your Robify account
                </P>
              </View>
              <View className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  nativeID="email"
                  placeholder="m@example.com"
                  inputMode="email"
                  value={email}
                  onChangeText={setEmail}
                  autoComplete="email"
                />
              </View>
              <View className="grid gap-2">
                <View className="flex-row items-center">
                  <Label nativeID="password">Password</Label>
                  <Link
                    href="/"
                    className="ml-auto text-muted-foreground text-sm underline-offset-2 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </View>
                <Input
                  id="password"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
              <Button
                className="w-full"
                onPress={signInWithEmail}
                disabled={loading}
              >
                <Text>{loading ? "Logging in..." : "Login"}</Text>
              </Button>
              <Text className="text-center text-muted-foreground">
                Or continue with
              </Text>
              <View className="flex-row gap-4">
                <Button variant="outline" className="flex-1">
                  <Apple className="fill-foreground" />
                </Button>
                <Button variant="outline" className="flex-1">
                  <Google className="fill-foreground" />
                </Button>
                <Button variant="outline" className="flex-1">
                  <Meta className="fill-foreground" />
                </Button>
              </View>
              <Text className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/" className="underline underline-offset-4">
                  Sign up
                </Link>
              </Text>
            </View>
          </View>
        </CardContent>
      </Card>
      <Text className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
        By clicking continue, you agree to our{" "}
        <Link href="/" className="underline underline-offset-4">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/" className="underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </Text>
    </View>
  );
}

import { Text, View, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSocialAuth } from "@/hooks/useSocialAuth";

export default function SignIn() {
  const { handleSocialAuth, isLoading } = useSocialAuth();
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Content */}
      <View className="flex-1 justify-between px-6 py-12">
        {/* Header */}
        <View className="mt-16 items-center">
        </View>

        {/* Auth Image */}
        <View className="items-center">
          <Image 
            source={require("../../assets/images/auth1.png")} 
            className="w-80 h-80"
            resizeMode="contain"
          />
        </View>

        {/* Sign In Options */}
        <View className="bg-white rounded-3xl p-8 mb-8 shadow-lg border border-gray-100">
          {/* Social Sign In Buttons */}
          <View className="space-y-6 gap-4">
            {/* Google Sign In */}
            <TouchableOpacity 
              className="bg-white border border-gray-300 rounded-xl py-4 flex-row items-center justify-center shadow-sm"
              disabled={isLoading}
              onPress={() => handleSocialAuth("oauth_google")}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="text-gray-700 font-semibold text-lg ml-3">Signing in...</Text>
                </>
              ) : (
                <>
                  <Image 
                    source={require("../../assets/images/google.png")} 
                    className="w-6 h-6 mr-3"
                    resizeMode="contain"
                  />
                  <Text className="text-gray-700 font-semibold text-lg">Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Apple Sign In */}
            <TouchableOpacity 
              className="bg-white border border-gray-300 rounded-xl py-4 flex-row items-center justify-center shadow-sm"
              disabled={isLoading}
              onPress={() => handleSocialAuth("oauth_apple")}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="text-gray-700 font-semibold text-lg ml-3">Signing in...</Text>
                </>
              ) : (
                <>
                  <Image 
                    source={require("../../assets/images/apple.png")} 
                    className="w-6 h-6 mr-3"
                    resizeMode="contain"
                  />
                  <Text className="text-gray-700 font-semibold text-lg">Continue with Apple</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View className="items-center">
        </View>
      </View>
    </SafeAreaView>
  );
}

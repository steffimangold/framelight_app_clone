import { MaterialIcons } from "@expo/vector-icons";
import { TextInput, View } from "react-native";

interface Props {
  placeholder: string;
  onPress?: () => void;
  value?: string;
  onChangeText?: (text: string) => void;
}

const SearchBar = ({ placeholder, onPress, value, onChangeText }: Props) => {
  return (
    <View className="flex-row items-center bg-slate-600 rounded-full px-5 py-1">
      <MaterialIcons name="search" size={20} color="#F5F5F5" className="mr-2" />

      <TextInput
        onPress={onPress}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#F5F5F5"
        className="flex-1 ml-2 text-white"
      />
    </View>
  );
};

export default SearchBar;

// src/screens/main/SettingsScreen.jsx
import React from 'react';
import { View, Text, StyleSheet, Switch, Alert, ScrollView } from 'react-native';
import { Button } from '../../components/ui/Button';
import { removeSessionId } from '../../services/storageService';
import { useTheme } from '../../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

const SettingsScreen = ({ navigation }) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = React.useState(true);

  const handleLogout = async () => {
    try {
      await removeSessionId();
      Alert.alert('Succès', 'Vous êtes déconnecté');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Erreur', 'Problème lors de la déconnexion');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          Préférences
        </Text>
        
        <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
          <View style={styles.settingHeader}>
            <Ionicons name="moon" size={24} color={theme.text} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Mode sombre
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: '#767577', true: theme.primary }}
            thumbColor={isDarkMode ? theme.primary : '#f4f3f4'}
          />
        </View>

        <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
          <View style={styles.settingHeader}>
            <Ionicons name="notifications" size={24} color={theme.text} />
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Notifications
            </Text>
          </View>
          <Switch
            value={isNotificationsEnabled}
            onValueChange={setIsNotificationsEnabled}
            trackColor={{ false: '#767577', true: theme.primary }}
            thumbColor={isNotificationsEnabled ? theme.primary : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          Application
        </Text>
        <View style={[styles.settingItem, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>Version</Text>
          <Text style={[styles.value, { color: theme.textSecondary }]}>1.0.0</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.primary }]}>
          Compte
        </Text>
        <Button
          title="Se déconnecter"
          onPress={handleLogout}
          variant="secondary"
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingLabel: {
    fontSize: 16,
  },
  label: {
    fontSize: 16,
  },
  value: {
    fontSize: 16,
  },
});

export default SettingsScreen;
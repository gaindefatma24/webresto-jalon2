package com.restaurant.auth.service;

import com.restaurant.auth.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * UserDetailsServiceImpl
 *
 * Spring Security appelle loadUserByUsername() automatiquement
 * lors de chaque authentification (login) pour charger l'utilisateur
 * depuis la base de données.
 *
 * Notre entité User implémente déjà UserDetails → on retourne
 * directement l'entité.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {
        return userRepository.findByEmail(email.toLowerCase())
            .orElseThrow(() ->
                new UsernameNotFoundException("Utilisateur non trouvé : " + email));
    }
}

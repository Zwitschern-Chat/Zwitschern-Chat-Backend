-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Erstellungszeit: 09. Feb 2024 um 19:41
-- Server-Version: 8.0.36-0ubuntu0.22.04.1
-- PHP-Version: 8.1.2-1ubuntu2.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `zwitschern`
--

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `post`
--

CREATE TABLE `post` (
  `id` int NOT NULL,
  `message` text,
  `user_number` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Daten für Tabelle `post`
--

INSERT INTO `post` (`id`, `message`, `user_number`, `created_at`) VALUES
(25, 'Läuft', 1, '2024-02-08 23:13:09'),
(26, 'Hallo', 2, '2024-02-08 23:25:45'),
(35, 'Hallo', 4, '2024-02-09 07:34:18'),
(36, 'Hihi', 2, '2024-02-09 12:05:38'),
(37, 'Hello again', 5, '2024-02-09 13:26:04'),
(38, 'Bitte testen', 3, '2024-02-09 13:27:08'),
(39, 'Ok', 5, '2024-02-09 13:28:06'),
(41, ':)', 6, '2024-02-09 13:37:58'),
(44, 'Geht', 1, '2024-02-09 15:53:33'),
(45, 'ich liebe zwitschern! :D', 7, '2024-02-09 15:57:34'),
(46, 'test', 3, '2024-02-09 16:38:30'),
(47, 'Ich auch', 5, '2024-02-09 17:16:49');

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `user`
--

CREATE TABLE `user` (
  `sub` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `username` varchar(255) NOT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `language` varchar(255) DEFAULT NULL,
  `bio` text,
  `number` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;

--
-- Daten für Tabelle `user`
--

INSERT INTO `user` (`sub`, `username`, `profile_picture`, `created_at`, `language`, `bio`, `number`) VALUES
('auth0|659d51e4c71804525a2635ae', 'civixi8632', 'https://s.gravatar.com/avatar/ff759f18ad5f7a9c49424e8baeea500a?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fci.png', '2024-02-08 22:50:15', NULL, NULL, 1),
('auth0|65c2a49349ef8564a0ecda34', 'mogon95734', 'https://s.gravatar.com/avatar/52bf2d597dd0d5b1a0e5e092bb0afb18?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fmo.png', '2024-02-08 23:02:36', NULL, NULL, 2),
('auth0|65c5d523e1ecca451f9dded0', 'mau', 'https://s.gravatar.com/avatar/be6744a162bb89025e5b05b37b1bd663?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fma.png', '2024-02-09 07:32:52', NULL, NULL, 4),
('auth0|65c6208fd1d6ee1429cb9d89', 'fedepat195', 'https://s.gravatar.com/avatar/6bc31ba986503b17b0d4421f99ccf26f?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Ffe.png', '2024-02-09 12:54:40', NULL, NULL, 5),
('auth0|65c63c19c5c4d742ae2a1ee5', 'idris', 'https://s.gravatar.com/avatar/c18bcf2c0d37c07fca068265627d67db?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fid.png', '2024-02-09 14:52:09', NULL, NULL, 7),
('google-oauth2|104830160339887109288', 'addy4ever0', 'https://lh3.googleusercontent.com/a/ACg8ocINdTjYwP77E4CuIc2PtuPcdF_wTHgSKSDk79A5U9Yn=s96-c', '2024-02-09 13:33:19', NULL, NULL, 6),
('google-oauth2|114000034811198148793', 'marvin.prigenitz', 'https://lh3.googleusercontent.com/a/ACg8ocIf98PTNoA0GDo3royfrMQyRnYYwZwqQe2mikYssBnFrfY=s96-c', '2024-02-09 00:08:57', NULL, NULL, 3);

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `post`
--
ALTER TABLE `post`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_number`);

--
-- Indizes für die Tabelle `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`sub`),
  ADD UNIQUE KEY `number` (`number`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `post`
--
ALTER TABLE `post`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;

--
-- AUTO_INCREMENT für Tabelle `user`
--
ALTER TABLE `user`
  MODIFY `number` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

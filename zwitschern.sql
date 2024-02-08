-- phpMyAdmin SQL Dump
-- version 5.1.1deb5ubuntu1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Erstellungszeit: 08. Feb 2024 um 23:22
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
(24, 'Test123', 1, '2024-02-08 23:11:10'),
(25, 'Läuft', 1, '2024-02-08 23:13:09');

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
('auth0|65c2a49349ef8564a0ecda34', 'mogon95734', 'https://s.gravatar.com/avatar/52bf2d597dd0d5b1a0e5e092bb0afb18?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fmo.png', '2024-02-08 23:02:36', NULL, NULL, 2);

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
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT für Tabelle `user`
--
ALTER TABLE `user`
  MODIFY `number` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

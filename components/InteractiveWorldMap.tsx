'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { geoMercator, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology } from 'topojson-specification'
import Link from 'next/link'

interface MilitaryBase {
  id: string
  name: string
  lat: number  // Geographic latitude
  lng: number  // Geographic longitude
  country: string
  type: 'us' | 'iran'
}

interface ApiFire {
  latitude: number
  longitude: number
  brightness?: number
  confidence?: string
  acq_date?: string
  acq_time?: string
}

interface ApiMilitaryFlight {
  latitude: number
  longitude: number
  callsign?: string
  altitude?: number
  speed?: number
  heading?: number
  country?: string
}

interface ApiEarthquake {
  latitude: number
  longitude: number
  magnitude?: number
  depth?: number
  place?: string
  time?: string
}

interface ApiNuclearFacility {
  latitude: number
  longitude: number
  name?: string
  type?: string
  country?: string
  status?: string
}

interface ApiMilitaryBaseData {
  latitude: number
  longitude: number
  name?: string
  country?: string
  type?: string
}

interface CountryMetadata {
  id: string
  name: string
  population?: string
  area?: string
  flag?: string
  avgAge?: string
  waterRemaining?: string
  gdpLoss?: string
  infrastructureDamage?: string
  isHighlighted: boolean
  highlightColor?: string
  populationLoss?: string
  resourceShift?: string
  militaryPersonnel?: string
  army?: string
  navy?: string
  airForce?: string
}

// Real geographic coordinates (latitude, longitude)
const militaryBases: MilitaryBase[] = [
  // US mainland
  { id: 'norfolk', name: 'Naval Station Norfolk', lat: 36.9466, lng: -76.3297, country: 'USA', type: 'us' },
  { id: 'pentagon', name: 'Pentagon / Washington DC', lat: 38.8714, lng: -77.0565, country: 'USA', type: 'us' },
  
  // Europe
  { id: 'ramstein', name: 'Ramstein Air Base', lat: 49.4369, lng: 7.6003, country: 'Germany', type: 'us' },
  { id: 'incirlik', name: 'Incirlik Air Base', lat: 37.0000, lng: 35.4259, country: 'Turkey', type: 'us' },
  { id: 'rota', name: 'Naval Station Rota', lat: 36.6453, lng: -6.3495, country: 'Spain', type: 'us' },
  
  // Middle East
  { id: 'bahrain', name: 'Naval Support Activity Bahrain', lat: 26.1552, lng: 50.6083, country: 'Bahrain', type: 'us' },
  { id: 'aludeid', name: 'Al Udeid Air Base', lat: 25.1173, lng: 51.3150, country: 'Qatar', type: 'us' },
  { id: 'arifjan', name: 'Camp Arifjan', lat: 28.9394, lng: 48.0839, country: 'Kuwait', type: 'us' },
  { id: 'aldhafra', name: 'Al Dhafra Air Base', lat: 24.2482, lng: 54.5479, country: 'UAE', type: 'us' },
  { id: 'jordan', name: 'Base in Jordan', lat: 31.9566, lng: 35.9457, country: 'Jordan', type: 'us' },
  { id: 'djibouti', name: 'Camp Lemonnier', lat: 11.5450, lng: 43.1453, country: 'Djibouti', type: 'us' },
  
  // Iran strategic targets
  { id: 'tehran', name: 'Tehran (Capital)', lat: 35.6892, lng: 51.3890, country: 'Iran', type: 'iran' },
  { id: 'natanz', name: 'Natanz Facility', lat: 33.7203, lng: 51.7133, country: 'Iran', type: 'iran' },
  { id: 'bushehr', name: 'Bushehr Nuclear', lat: 28.9684, lng: 50.8385, country: 'Iran', type: 'iran' },
  { id: 'bandarabbas', name: 'Bandar Abbas Naval', lat: 27.1865, lng: 56.2808, country: 'Iran', type: 'iran' },
  
  // Asia-Pacific
  { id: 'yokosuka', name: 'Yokosuka Naval Base', lat: 35.2934, lng: 139.6692, country: 'Japan', type: 'us' },
  { id: 'guam', name: 'Naval Base Guam', lat: 13.4443, lng: 144.7937, country: 'Guam', type: 'us' },
  { id: 'diego', name: 'Diego Garcia', lat: -7.3194, lng: 72.4236, country: 'BIOT', type: 'us' },
]

// Country metadata for tooltips and highlights
const countryMetadata: Record<string, CountryMetadata> = {
  'USA': {
    id: 'USA',
    name: 'United States of America',
    population: '331,002,651',
    area: '9,833,520 km²',
    flag: '🇺🇸',
    avgAge: '42.3 years',
    waterRemaining: '78% of pre-war levels',
    gdpLoss: '-18.7%',
    infrastructureDamage: '23% damaged',
    isHighlighted: true,
    highlightColor: '#0096ff',
    populationLoss: '12.4%',
    resourceShift: '+8.2% Energy',
    militaryPersonnel: '1,328,000',
    army: '485,000',
    navy: '347,000',
    airForce: '329,000'
  },
  'IRN': {
    id: 'IRN',
    name: 'Islamic Republic of Iran',
    population: '83,992,949',
    area: '1,648,195 km²',
    flag: '🇮🇷',
    avgAge: '38.1 years',
    waterRemaining: '34% of pre-war levels',
    gdpLoss: '-67.2%',
    infrastructureDamage: '81% destroyed',
    isHighlighted: true,
    highlightColor: '#ff0066',
    populationLoss: '34.7%',
    resourceShift: '-45.3% Oil',
    militaryPersonnel: '523,000',
    army: '350,000',
    navy: '18,000',
    airForce: '37,000'
  },
  'ISR': {
    id: 'ISR',
    name: 'Israel',
    population: '9,216,900',
    area: '20,770 km²',
    flag: '🇮🇱',
    avgAge: '39.7 years',
    waterRemaining: '91% of pre-war levels',
    gdpLoss: '-28.4%',
    infrastructureDamage: '34% damaged',
    isHighlighted: true,
    highlightColor: '#ffb000',
    populationLoss: '18.9%',
    resourceShift: '+12% Water',
    militaryPersonnel: '169,500',
    army: '126,000',
    navy: '9,500',
    airForce: '34,000'
  },
  'ARE': {
    id: 'ARE',
    name: 'United Arab Emirates',
    population: '9,890,402',
    area: '83,600 km²',
    flag: '🇦🇪',
    avgAge: '35.2 years',
    waterRemaining: '52% of pre-war levels',
    gdpLoss: '-41.3%',
    infrastructureDamage: '56% damaged',
    isHighlighted: true,
    highlightColor: '#0096ff',
    populationLoss: '15.2%',
    resourceShift: '-28% Infrastructure',
    militaryPersonnel: '63,000',
    army: '44,000',
    navy: '2,500',
    airForce: '4,500'
  },
  'QAT': {
    id: 'QAT',
    name: 'Qatar',
    population: '2,881,053',
    area: '11,586 km²',
    flag: '🇶🇦',
    avgAge: '33.9 years',
    waterRemaining: '44% of pre-war levels',
    gdpLoss: '-52.8%',
    infrastructureDamage: '63% damaged',
    isHighlighted: true,
    highlightColor: '#0096ff',
    populationLoss: '29.1%',
    resourceShift: '-38% Infrastructure',
    militaryPersonnel: '11,800',
    army: '8,500',
    navy: '1,800',
    airForce: '1,500'
  },
  'JOR': {
    id: 'JOR',
    name: 'Jordan',
    population: '10,203,134',
    area: '89,342 km²',
    flag: '🇯🇴',
    avgAge: '36.4 years',
    waterRemaining: '61% of pre-war levels',
    gdpLoss: '-33.1%',
    infrastructureDamage: '38% damaged',
    isHighlighted: true,
    highlightColor: '#0096ff',
    populationLoss: '11.8%',
    resourceShift: '-22% Infrastructure',
    militaryPersonnel: '100,500',
    army: '88,000',
    navy: '500',
    airForce: '12,000'
  },
  'RUS': {
    id: 'RUS',
    name: 'Russian Federation',
    population: '144,104,080',
    area: '17,098,242 km²',
    flag: '🇷🇺',
    avgAge: '40.3 years',
    waterRemaining: '88% of pre-war levels',
    isHighlighted: false,
    militaryPersonnel: '1,014,000',
    army: '280,000',
    navy: '150,000',
    airForce: '165,000'
  },
  'CHN': {
    id: 'CHN',
    name: 'China',
    population: '1,411,750,000',
    area: '9,596,961 km²',
    flag: '🇨🇳',
    avgAge: '38.4 years',
    waterRemaining: '73% of pre-war levels',
    isHighlighted: false,
    militaryPersonnel: '2,035,000',
    army: '965,000',
    navy: '240,000',
    airForce: '395,000'
  },
  'DEU': {
    id: 'DEU',
    name: 'Germany',
    population: '83,149,300',
    area: '357,022 km²',
    flag: '🇩🇪',
    avgAge: '45.7 years',
    waterRemaining: '94% of pre-war levels',
    isHighlighted: false,
    highlightColor: '#0096ff',
    militaryPersonnel: '183,000',
    army: '62,000',
    navy: '16,000',
    airForce: '28,000'
  },
  'TUR': {
    id: 'TUR',
    name: 'Turkey',
    population: '84,680,273',
    area: '783,356 km²',
    flag: '🇹🇷',
    isHighlighted: false,
    highlightColor: '#0096ff',
    militaryPersonnel: '355,000',
    army: '260,000',
    navy: '45,000',
    airForce: '50,000'
  },
  'ESP': {
    id: 'ESP',
    name: 'Spain',
    population: '47,351,567',
    area: '505,990 km²',
    flag: '🇪🇸',
    isHighlighted: false,
    highlightColor: '#0096ff',
    militaryPersonnel: '121,000',
    army: '75,000',
    navy: '20,000',
    airForce: '26,000'
  },
  'BHR': {
    id: 'BHR',
    name: 'Bahrain',
    population: '1,701,583',
    area: '765 km²',
    flag: '🇧🇭',
    isHighlighted: false,
    highlightColor: '#0096ff',
    militaryPersonnel: '8,200',
    army: '6,000',
    navy: '700',
    airForce: '1,500'
  },
  'KWT': {
    id: 'KWT',
    name: 'Kuwait',
    population: '4,270,563',
    area: '17,818 km²',
    flag: '🇰🇼',
    isHighlighted: false,
    highlightColor: '#0096ff',
    militaryPersonnel: '15,500',
    army: '11,000',
    navy: '2,000',
    airForce: '2,500'
  },
  'DJI': {
    id: 'DJI',
    name: 'Djibouti',
    population: '988,002',
    area: '23,200 km²',
    flag: '🇩🇯',
    isHighlighted: false,
    highlightColor: '#0096ff',
    militaryPersonnel: '8,000',
    army: '6,500',
    navy: '200',
    airForce: '250'
  },
  'JPN': {
    id: 'JPN',
    name: 'Japan',
    population: '125,960,000',
    area: '377,975 km²',
    flag: '🇯🇵',
    isHighlighted: false,
    highlightColor: '#0096ff',
    militaryPersonnel: '247,000',
    army: '138,000',
    navy: '45,000',
    airForce: '43,000'
  },
  'GUM': {
    id: 'GUM',
    name: 'Guam',
    population: '168,801',
    area: '549 km²',
    flag: '🇬🇺',
    isHighlighted: false,
    highlightColor: '#0096ff'
  }
}

// Basic country data for all countries (fallback data)
const basicCountryData: Record<string, { name: string; population: string; area: string; capital: string; continent: string; flag: string }> = {
  // Asia
  'AFG': { name: 'Afghanistan', population: '38,928,346', area: '652,230 km²', capital: 'Kabul', continent: 'Asia', flag: '🇦🇫' },
  'PAK': { name: 'Pakistan', population: '220,892,340', area: '881,913 km²', capital: 'Islamabad', continent: 'Asia', flag: '🇵🇰' },
  'IND': { name: 'India', population: '1,380,004,385', area: '3,287,263 km²', capital: 'New Delhi', continent: 'Asia', flag: '🇮🇳' },
  'CHN': { name: 'China', population: '1,439,323,776', area: '9,596,961 km²', capital: 'Beijing', continent: 'Asia', flag: '🇨🇳' },
  'RUS': { name: 'Russia', population: '145,934,462', area: '17,098,242 km²', capital: 'Moscow', continent: 'Europe/Asia', flag: '🇷🇺' },
  'SAU': { name: 'Saudi Arabia', population: '34,813,871', area: '2,149,690 km²', capital: 'Riyadh', continent: 'Asia', flag: '🇸🇦' },
  'YEM': { name: 'Yemen', population: '29,825,964', area: '527,968 km²', capital: 'Sana\'a', continent: 'Asia', flag: '🇾🇪' },
  'OMN': { name: 'Oman', population: '5,106,626', area: '309,500 km²', capital: 'Muscat', continent: 'Asia', flag: '🇴🇲' },
  'IRQ': { name: 'Iraq', population: '40,222,493', area: '438,317 km²', capital: 'Baghdad', continent: 'Asia', flag: '🇮🇶' },
  'SYR': { name: 'Syria', population: '17,500,658', area: '185,180 km²', capital: 'Damascus', continent: 'Asia', flag: '🇸🇾' },
  'LBN': { name: 'Lebanon', population: '6,825,445', area: '10,452 km²', capital: 'Beirut', continent: 'Asia', flag: '🇱🇧' },
  'PSE': { name: 'Palestine', population: '5,101,414', area: '6,020 km²', capital: 'Ramallah', continent: 'Asia', flag: '🇵🇸' },
  'EGY': { name: 'Egypt', population: '102,334,404', area: '1,002,450 km²', capital: 'Cairo', continent: 'Africa', flag: '🇪🇬' },
  'TUR': { name: 'Turkey', population: '84,339,067', area: '783,562 km²', capital: 'Ankara', continent: 'Europe/Asia', flag: '🇹🇷' },
  'KAZ': { name: 'Kazakhstan', population: '18,776,707', area: '2,724,900 km²', capital: 'Astana', continent: 'Asia', flag: '🇰🇿' },
  'UZB': { name: 'Uzbekistan', population: '33,469,203', area: '447,400 km²', capital: 'Tashkent', continent: 'Asia', flag: '🇺🇿' },
  'TKM': { name: 'Turkmenistan', population: '6,031,200', area: '488,100 km²', capital: 'Ashgabat', continent: 'Asia', flag: '🇹🇲' },
  'TJK': { name: 'Tajikistan', population: '9,537,645', area: '143,100 km²', capital: 'Dushanbe', continent: 'Asia', flag: '🇹🇯' },
  'KGZ': { name: 'Kyrgyzstan', population: '6,524,195', area: '199,951 km²', capital: 'Bishkek', continent: 'Asia', flag: '🇰🇬' },
  'MNG': { name: 'Mongolia', population: '3,278,290', area: '1,564,110 km²', capital: 'Ulaanbaatar', continent: 'Asia', flag: '🇲🇳' },
  'PRK': { name: 'North Korea', population: '25,778,816', area: '120,538 km²', capital: 'Pyongyang', continent: 'Asia', flag: '🇰🇵' },
  'KOR': { name: 'South Korea', population: '51,269,185', area: '100,210 km²', capital: 'Seoul', continent: 'Asia', flag: '🇰🇷' },
  'VNM': { name: 'Vietnam', population: '97,338,579', area: '331,212 km²', capital: 'Hanoi', continent: 'Asia', flag: '🇻🇳' },
  'THA': { name: 'Thailand', population: '69,799,978', area: '513,120 km²', capital: 'Bangkok', continent: 'Asia', flag: '🇹🇭' },
  'MMR': { name: 'Myanmar', population: '54,409,800', area: '676,578 km²', capital: 'Naypyidaw', continent: 'Asia', flag: '🇲🇲' },
  'IDN': { name: 'Indonesia', population: '273,523,615', area: '1,904,569 km²', capital: 'Jakarta', continent: 'Asia', flag: '🇮🇩' },
  'MYS': { name: 'Malaysia', population: '32,365,999', area: '330,803 km²', capital: 'Kuala Lumpur', continent: 'Asia', flag: '🇲🇾' },
  'PHL': { name: 'Philippines', population: '109,581,078', area: '300,000 km²', capital: 'Manila', continent: 'Asia', flag: '🇵🇭' },
  
  // Europe
  'GBR': { name: 'United Kingdom', population: '67,886,011', area: '242,495 km²', capital: 'London', continent: 'Europe', flag: '🇬🇧' },
  'FRA': { name: 'France', population: '65,273,511', area: '643,801 km²', capital: 'Paris', continent: 'Europe', flag: '🇫🇷' },
  'DEU': { name: 'Germany', population: '83,783,942', area: '357,022 km²', capital: 'Berlin', continent: 'Europe', flag: '🇩🇪' },
  'ITA': { name: 'Italy', population: '60,461,826', area: '301,340 km²', capital: 'Rome', continent: 'Europe', flag: '🇮🇹' },
  'ESP': { name: 'Spain', population: '46,754,778', area: '505,992 km²', capital: 'Madrid', continent: 'Europe', flag: '🇪🇸' },
  'POL': { name: 'Poland', population: '37,846,611', area: '312,696 km²', capital: 'Warsaw', continent: 'Europe', flag: '🇵🇱' },
  'UKR': { name: 'Ukraine', population: '43,733,762', area: '603,500 km²', capital: 'Kyiv', continent: 'Europe', flag: '🇺🇦' },
  'ROU': { name: 'Romania', population: '19,237,691', area: '238,397 km²', capital: 'Bucharest', continent: 'Europe', flag: '🇷🇴' },
  'NLD': { name: 'Netherlands', population: '17,134,872', area: '41,543 km²', capital: 'Amsterdam', continent: 'Europe', flag: '🇳🇱' },
  'BEL': { name: 'Belgium', population: '11,589,623', area: '30,528 km²', capital: 'Brussels', continent: 'Europe', flag: '🇧🇪' },
  'GRC': { name: 'Greece', population: '10,423,054', area: '131,957 km²', capital: 'Athens', continent: 'Europe', flag: '🇬🇷' },
  'CZE': { name: 'Czech Republic', population: '10,708,981', area: '78,865 km²', capital: 'Prague', continent: 'Europe', flag: '🇨🇿' },
  'PRT': { name: 'Portugal', population: '10,196,709', area: '92,090 km²', capital: 'Lisbon', continent: 'Europe', flag: '🇵🇹' },
  'SWE': { name: 'Sweden', population: '10,099,265', area: '450,295 km²', capital: 'Stockholm', continent: 'Europe', flag: '🇸🇪' },
  'HUN': { name: 'Hungary', population: '9,660,351', area: '93,028 km²', capital: 'Budapest', continent: 'Europe', flag: '🇭🇺' },
  'BLR': { name: 'Belarus', population: '9,449,323', area: '207,600 km²', capital: 'Minsk', continent: 'Europe', flag: '🇧🇾' },
  'AUT': { name: 'Austria', population: '9,006,398', area: '83,871 km²', capital: 'Vienna', continent: 'Europe', flag: '🇦🇹' },
  'SRB': { name: 'Serbia', population: '8,737,371', area: '88,361 km²', capital: 'Belgrade', continent: 'Europe', flag: '🇷🇸' },
  'CHE': { name: 'Switzerland', population: '8,654,622', area: '41,285 km²', capital: 'Bern', continent: 'Europe', flag: '🇨🇭' },
  'BGR': { name: 'Bulgaria', population: '6,948,445', area: '110,879 km²', capital: 'Sofia', continent: 'Europe', flag: '🇧🇬' },
  'DNK': { name: 'Denmark', population: '5,792,202', area: '42,933 km²', capital: 'Copenhagen', continent: 'Europe', flag: '🇩🇰' },
  'FIN': { name: 'Finland', population: '5,540,720', area: '338,424 km²', capital: 'Helsinki', continent: 'Europe', flag: '🇫🇮' },
  'NOR': { name: 'Norway', population: '5,421,241', area: '323,802 km²', capital: 'Oslo', continent: 'Europe', flag: '🇳🇴' },
  'IRL': { name: 'Ireland', population: '4,937,786', area: '70,273 km²', capital: 'Dublin', continent: 'Europe', flag: '🇮🇪' },
  'HRV': { name: 'Croatia', population: '4,105,267', area: '56,594 km²', capital: 'Zagreb', continent: 'Europe', flag: '🇭🇷' },
  'BIH': { name: 'Bosnia and Herzegovina', population: '3,280,819', area: '51,209 km²', capital: 'Sarajevo', continent: 'Europe', flag: '🇧🇦' },
  'ALB': { name: 'Albania', population: '2,877,797', area: '28,748 km²', capital: 'Tirana', continent: 'Europe', flag: '🇦🇱' },
  'LTU': { name: 'Lithuania', population: '2,722,289', area: '65,300 km²', capital: 'Vilnius', continent: 'Europe', flag: '🇱🇹' },
  'SVN': { name: 'Slovenia', population: '2,078,938', area: '20,273 km²', capital: 'Ljubljana', continent: 'Europe', flag: '🇸🇮' },
  'LVA': { name: 'Latvia', population: '1,886,198', area: '64,559 km²', capital: 'Riga', continent: 'Europe', flag: '🇱🇻' },
  'EST': { name: 'Estonia', population: '1,326,535', area: '45,227 km²', capital: 'Tallinn', continent: 'Europe', flag: '🇪🇪' },
  
  // Africa
  'NGA': { name: 'Nigeria', population: '206,139,589', area: '923,768 km²', capital: 'Abuja', continent: 'Africa', flag: '🇳🇬' },
  'ETH': { name: 'Ethiopia', population: '114,963,588', area: '1,104,300 km²', capital: 'Addis Ababa', continent: 'Africa', flag: '🇪🇹' },
  'ZAF': { name: 'South Africa', population: '59,308,690', area: '1,221,037 km²', capital: 'Pretoria', continent: 'Africa', flag: '🇿🇦' },
  'TZA': { name: 'Tanzania', population: '59,734,218', area: '945,087 km²', capital: 'Dodoma', continent: 'Africa', flag: '🇹🇿' },
  'KEN': { name: 'Kenya', population: '53,771,296', area: '580,367 km²', capital: 'Nairobi', continent: 'Africa', flag: '🇰🇪' },
  'UGA': { name: 'Uganda', population: '45,741,007', area: '241,038 km²', capital: 'Kampala', continent: 'Africa', flag: '🇺🇬' },
  'DZA': { name: 'Algeria', population: '43,851,044', area: '2,381,741 km²', capital: 'Algiers', continent: 'Africa', flag: '🇩🇿' },
  'SDN': { name: 'Sudan', population: '43,849,260', area: '1,886,068 km²', capital: 'Khartoum', continent: 'Africa', flag: '🇸🇩' },
  'MAR': { name: 'Morocco', population: '36,910,560', area: '446,550 km²', capital: 'Rabat', continent: 'Africa', flag: '🇲🇦' },
  'GHA': { name: 'Ghana', population: '31,072,940', area: '238,533 km²', capital: 'Accra', continent: 'Africa', flag: '🇬🇭' },
  'MOZ': { name: 'Mozambique', population: '31,255,435', area: '801,590 km²', capital: 'Maputo', continent: 'Africa', flag: '🇲🇿' },
  'AGO': { name: 'Angola', population: '32,866,272', area: '1,246,700 km²', capital: 'Luanda', continent: 'Africa', flag: '🇦🇴' },
  'CMR': { name: 'Cameroon', population: '26,545,863', area: '475,442 km²', capital: 'Yaoundé', continent: 'Africa', flag: '🇨🇲' },
  'CIV': { name: 'Ivory Coast', population: '26,378,274', area: '322,463 km²', capital: 'Yamoussoukro', continent: 'Africa', flag: '🇨🇮' },
  'MDG': { name: 'Madagascar', population: '27,691,018', area: '587,041 km²', capital: 'Antananarivo', continent: 'Africa', flag: '🇲🇬' },
  'ZWE': { name: 'Zimbabwe', population: '14,862,924', area: '390,757 km²', capital: 'Harare', continent: 'Africa', flag: '🇿🇼' },
  'TUN': { name: 'Tunisia', population: '11,818,619', area: '163,610 km²', capital: 'Tunis', continent: 'Africa', flag: '🇹🇳' },
  'LBY': { name: 'Libya', population: '6,871,292', area: '1,759,540 km²', capital: 'Tripoli', continent: 'Africa', flag: '🇱🇾' },
  
  // North America
  'CAN': { name: 'Canada', population: '37,742,154', area: '9,984,670 km²', capital: 'Ottawa', continent: 'North America', flag: '🇨🇦' },
  'MEX': { name: 'Mexico', population: '128,932,753', area: '1,964,375 km²', capital: 'Mexico City', continent: 'North America', flag: '🇲🇽' },
  'GTM': { name: 'Guatemala', population: '17,915,568', area: '108,889 km²', capital: 'Guatemala City', continent: 'North America', flag: '🇬🇹' },
  'CUB': { name: 'Cuba', population: '11,326,616', area: '109,884 km²', capital: 'Havana', continent: 'North America', flag: '🇨🇺' },
  'HND': { name: 'Honduras', population: '9,904,607', area: '112,492 km²', capital: 'Tegucigalpa', continent: 'North America', flag: '🇭🇳' },
  'NIC': { name: 'Nicaragua', population: '6,624,554', area: '130,373 km²', capital: 'Managua', continent: 'North America', flag: '🇳🇮' },
  'CRI': { name: 'Costa Rica', population: '5,094,118', area: '51,100 km²', capital: 'San José', continent: 'North America', flag: '🇨🇷' },
  'PAN': { name: 'Panama', population: '4,314,767', area: '75,417 km²', capital: 'Panama City', continent: 'North America', flag: '🇵🇦' },
  
  // South America
  'BRA': { name: 'Brazil', population: '212,559,417', area: '8,515,767 km²', capital: 'Brasília', continent: 'South America', flag: '🇧🇷' },
  'COL': { name: 'Colombia', population: '50,882,891', area: '1,141,748 km²', capital: 'Bogotá', continent: 'South America', flag: '🇨🇴' },
  'ARG': { name: 'Argentina', population: '45,195,774', area: '2,780,400 km²', capital: 'Buenos Aires', continent: 'South America', flag: '🇦🇷' },
  'PER': { name: 'Peru', population: '32,971,854', area: '1,285,216 km²', capital: 'Lima', continent: 'South America', flag: '🇵🇪' },
  'VEN': { name: 'Venezuela', population: '28,435,940', area: '916,445 km²', capital: 'Caracas', continent: 'South America', flag: '🇻🇪' },
  'CHL': { name: 'Chile', population: '19,116,201', area: '756,102 km²', capital: 'Santiago', continent: 'South America', flag: '🇨🇱' },
  'ECU': { name: 'Ecuador', population: '17,643,054', area: '283,561 km²', capital: 'Quito', continent: 'South America', flag: '🇪🇨' },
  'BOL': { name: 'Bolivia', population: '11,673,021', area: '1,098,581 km²', capital: 'La Paz', continent: 'South America', flag: '🇧🇴' },
  'PRY': { name: 'Paraguay', population: '7,132,538', area: '406,752 km²', capital: 'Asunción', continent: 'South America', flag: '🇵🇾' },
  'URY': { name: 'Uruguay', population: '3,473,730', area: '176,215 km²', capital: 'Montevideo', continent: 'South America', flag: '🇺🇾' },
  
  // Oceania
  'AUS': { name: 'Australia', population: '25,499,884', area: '7,692,024 km²', capital: 'Canberra', continent: 'Oceania', flag: '🇦🇺' },
  'PNG': { name: 'Papua New Guinea', population: '8,947,024', area: '462,840 km²', capital: 'Port Moresby', continent: 'Oceania', flag: '🇵🇬' },
  'NZL': { name: 'New Zealand', population: '4,822,233', area: '268,838 km²', capital: 'Wellington', continent: 'Oceania', flag: '🇳🇿' },
}

export default function InteractiveWorldMap() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [hoveredCountryName, setHoveredCountryName] = useState<string | null>(null)
  const [hoveredCountryProps, setHoveredCountryProps] = useState<any>(null)
  const [hoveredBase, setHoveredBase] = useState<MilitaryBase | null>(null)
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry> | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  
  // API data states
  const [apiMilitaryBases, setApiMilitaryBases] = useState<ApiMilitaryBaseData[]>([])
  const [fireDetections, setFireDetections] = useState<ApiFire[]>([])
  const [militaryFlights, setMilitaryFlights] = useState<ApiMilitaryFlight[]>([])
  const [earthquakes, setEarthquakes] = useState<ApiEarthquake[]>([])
  const [nuclearFacilities, setNuclearFacilities] = useState<ApiNuclearFacility[]>([])
  const [hoveredApiItem, setHoveredApiItem] = useState<{type: string, data: any} | null>(null)

  // Map dimensions
  const width = 1000
  const height = 550

  // D3 Mercator projection
  const projection = useMemo(() => {
    return geoMercator()
      .scale(160)
      .translate([width / 2, height / 1.5])
      .center([0, 20]) // Center on equator, slight north
  }, [])

  // Path generator
  const pathGenerator = useMemo(() => {
    return geoPath().projection(projection)
  }, [projection])

  // Load world TopoJSON data
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then((topology: Topology) => {
        const countries = feature(topology, topology.objects.countries as any) as unknown as FeatureCollection<Geometry>
        setWorldData(countries)
      })
      .catch(error => console.error('Error loading world data:', error))
  }, [])

  // Fetch data from external APIs
  useEffect(() => {
    // Fetch military bases
    fetch('/api/military-bases')
      .then(res => res.json())
      .then(data => {
        console.log('Military Bases API Response:', data)
        const bases = data.bases || []
        console.log(`✓ Loaded ${bases.length} military bases`)
        setApiMilitaryBases(bases)
      })
      .catch(err => console.error('Error fetching military bases:', err))

    // Fetch fire detections
    fetch('/api/fire-detections')
      .then(res => res.json())
      .then(data => {
        console.log('Fire Detections API Response:', data)
        const fires = data.fires || []
        console.log(`✓ Loaded ${fires.length} fire detections`)
        setFireDetections(fires)
      })
      .catch(err => console.error('Error fetching fire detections:', err))

    // Fetch military flights
    fetch('/api/military-flights')
      .then(res => res.json())
      .then(data => {
        console.log('Military Flights API Response:', data)
        const flights = data.flights || []
        console.log(`✓ Loaded ${flights.length} military flights`)
        setMilitaryFlights(flights)
      })
      .catch(err => console.error('Error fetching military flights:', err))

    // Fetch earthquakes
    fetch('/api/earthquakes')
      .then(res => res.json())
      .then(data => {
        console.log('Earthquakes API Response:', data)
        const earthquakes = data.earthquakes || []
        console.log(`✓ Loaded ${earthquakes.length} earthquakes`)
        setEarthquakes(earthquakes)
      })
      .catch(err => console.error('Error fetching earthquakes:', err))

    // Fetch nuclear facilities
    fetch('/api/nuclear-facilities')
      .then(res => res.json())
      .then(data => {
        console.log('Nuclear Facilities API Response:', data)
        const facilities = data.facilities || []
        console.log(`✓ Loaded ${facilities.length} nuclear facilities`)
        setNuclearFacilities(facilities)
      })
      .catch(err => console.error('Error fetching nuclear facilities:', err))
  }, [])

  // Project lat/lng to screen coordinates
  const projectPoint = (lat: number, lng: number): [number, number] => {
    const coords = projection([lng, lat])
    return coords ?? [0, 0]
  }

  const handleCountryHover = (countryId: string, countryName: string, properties: any, event?: React.MouseEvent) => {
    console.log('=== HOVER EVENT ===')
    console.log('Country ID:', countryId)
    console.log('Country Name:', countryName)
    console.log('Properties:', properties)
    console.log('Has metadata:', !!getCountryMetadata(countryId))
    setHoveredCountry(countryId)
    setHoveredCountryName(countryName)
    setHoveredCountryProps(properties)
  }

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget
    const rect = svg.getBoundingClientRect()
    setMousePos({ 
      x: event.clientX - rect.left, 
      y: event.clientY - rect.top 
    })
  }

  const handleCountryLeave = () => {
    console.log('=== LEAVE EVENT ===')
    setHoveredCountry(null)
    setHoveredCountryName(null)
    setHoveredCountryProps(null)
  }

  const handleBaseHover = (base: MilitaryBase, event?: React.MouseEvent) => {
    console.log('Hovering base:', base.name)
    setHoveredBase(base)
  }

  const handleBaseLeave = () => {
    setHoveredBase(null)
  }

  const handleApiItemHover = (type: string, data: any) => {
    setHoveredApiItem({ type, data })
  }

  const handleApiItemLeave = () => {
    setHoveredApiItem(null)
  }

  // Get country ISO code from properties
  const getCountryId = (properties: any): string => {
    return properties?.['iso_a3'] || properties?.['adm0_a3'] || properties?.['iso_a2'] || properties?.['name'] || ''
  }

  // Helper to get country metadata with fallback lookups
  const getCountryMetadata = (countryId: string) => {
    if (!countryId) return null
    
    // Direct lookup (handles ISO codes like 'USA', 'RUS', 'CHN', etc.)
    if (countryMetadata[countryId]) {
      console.log(`✓ Found metadata for ${countryId}:`, countryMetadata[countryId].name)
      return countryMetadata[countryId]
    }
    
    // Uppercase lookup
    const upperCaseId = countryId.toUpperCase()
    if (countryMetadata[upperCaseId]) {
      console.log(`✓ Found metadata for ${upperCaseId} (uppercase):`, countryMetadata[upperCaseId].name)
      return countryMetadata[upperCaseId]
    }
    
    // Try to find by matching name (fuzzy match)
    const matchingKey = Object.keys(countryMetadata).find(key => {
      const meta = countryMetadata[key]
      const nameMatch = meta.name.toLowerCase().includes(countryId.toLowerCase()) || 
                        countryId.toLowerCase().includes(meta.name.toLowerCase())
      if (nameMatch) {
        console.log(`✓ Found metadata for ${countryId} by name match (${key}):`, meta.name)
      }
      return nameMatch
    })
    
    if (matchingKey) {
      return countryMetadata[matchingKey]
    }
    
    // Log when no metadata found
    console.log(`✗ No metadata found for: ${countryId}`)
    return null
  }

  // Helper to get basic country data with fallback lookups
  const getBasicCountryData = (countryId: string) => {
    if (!countryId) return null
    
    // Direct lookup (ISO code)
    if (basicCountryData[countryId]) {
      return basicCountryData[countryId]
    }
    
    // Uppercase lookup
    const upperCaseId = countryId.toUpperCase()
    if (basicCountryData[upperCaseId]) {
      return basicCountryData[upperCaseId]
    }
    
    // Try to find by matching name
    const matchingKey = Object.keys(basicCountryData).find(key => {
      const data = basicCountryData[key]
      return data.name.toLowerCase() === countryId.toLowerCase() ||
             data.name.toLowerCase().includes(countryId.toLowerCase()) ||
             countryId.toLowerCase().includes(data.name.toLowerCase())
    })
    
    if (matchingKey) {
      console.log(`✓ Found basic data for ${countryId} by name match (${matchingKey}):`, basicCountryData[matchingKey].name)
      return basicCountryData[matchingKey]
    }
    
    console.log(`✗ No basic data found for: ${countryId}`)
    return null
  }

  if (!worldData) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-black text-cyan-400 font-mono">
        <div className="text-center">
          <div className="animate-pulse text-2xl mb-2">⚡ LOADING TACTICAL MAP ⚡</div>
          <div className="text-sm opacity-60">Initializing geographic data...</div>
        </div>
      </div>
    )
  }

  // Calculate strike vectors using real coordinates
  const getStrikeVector = (from: MilitaryBase, to: MilitaryBase) => {
    const [x1, y1] = projectPoint(from.lat, from.lng)
    const [x2, y2] = projectPoint(to.lat, to.lng)
    
    // Create curved path using quadratic bezier
    const midX = (x1 + x2) / 2
    const midY = Math.min(y1, y2) - 50 // Curve upward
    
    return `M ${x1},${y1} Q ${midX},${midY} ${x2},${y2}`
  }

  // Get Iran center for threat radius
  const iranCenter = militaryBases.find(b => b.id === 'tehran')
  const iranCenterProj = iranCenter ? projectPoint(iranCenter.lat, iranCenter.lng) : [0, 0]

  return (
    <div className="space-y-4">
      {/* Heading */}
      <div className="bg-black border-2 border-cyber-amber/50 p-3 md:p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold neon-amber font-mono tracking-wider">
            THEATER OF OPERATIONS
          </h2>
          <p className="text-gray-500 text-[10px] sm:text-xs md:text-sm font-mono tracking-widest mt-1">
            GLOBAL RESTRUCTURING // 2045-2067
          </p>
        </div>
        <Link 
          href="/map"
          className="group relative px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono font-bold uppercase tracking-wider hover:scale-105 transition-transform border-2 border-cyan-400 shadow-lg shadow-cyan-500/50 text-xs sm:text-sm"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            ENHANCE MAP
          </span>
          <div className="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"></div>
        </Link>
      </div>

      <div ref={containerRef} className="relative w-full h-full bg-black rounded-lg border-2 border-cyan-900 shadow-2xl overflow-visible" style={{ minHeight: 'clamp(400px, 70vh, 550px)' }}>
        
        {/* Country Tooltip - Cyberpunk Dialog */}
        {hoveredCountry && (() => {
          const metadata = getCountryMetadata(hoveredCountry)
          const isMobile = typeof window !== 'undefined' && window.innerWidth < 640
          const tooltipWidth = isMobile ? 280 : 350
          const maxLeft = typeof window !== 'undefined' ? window.innerWidth - tooltipWidth - 20 : 800
          const maxTop = typeof window !== 'undefined' ? window.innerHeight - 300 : 400
          return (
          <div
          className="font-mono text-[10px] sm:text-xs pointer-events-none w-[280px] sm:max-w-[350px]"
          style={{ 
            position: 'absolute',
            left: Math.min(mousePos.x + 15, maxLeft),
            top: Math.min(mousePos.y + 15, maxTop),
            zIndex: 10000,
          }}
        >
          {/* Glow effect layer */}
          <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-lg"></div>
          
          {/* Main dialog */}
          <div 
            className="relative bg-gradient-to-br from-black via-gray-950 to-black rounded-lg overflow-hidden"
            style={{
              border: '2px solid transparent',
              backgroundImage: metadata ? 'linear-gradient(black, black), linear-gradient(135deg, #00ffff 0%, #ffb000 50%, #00ffff 100%)' : 'linear-gradient(black, black), linear-gradient(135deg, #4a5568 0%, #718096 50%, #4a5568 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: metadata ? '0 0 40px rgba(0, 255, 255, 0.4), 0 0 80px rgba(0, 255, 255, 0.2), inset 0 0 40px rgba(0, 255, 255, 0.05)' : '0 0 20px rgba(100, 116, 139, 0.3)'
            }}
          >
            {/* Scanline effect */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)',
              animation: 'scan 8s linear infinite'
            }}></div>
            
            {/* Corner accents */}
            <div className={`absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 ${metadata ? 'border-cyan-400' : 'border-gray-500'}`}></div>
            <div className={`absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 ${metadata ? 'border-cyan-400' : 'border-gray-500'}`}></div>
            <div className={`absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 ${metadata ? 'border-amber-400' : 'border-gray-600'}`}></div>
            <div className={`absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 ${metadata ? 'border-amber-400' : 'border-gray-600'}`}></div>
            
            {/* Content */}
            <div className="relative p-4 pb-3">
              {/* Header */}
              <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-cyan-800/60">
                {(() => {
                  const basicData = hoveredCountry ? getBasicCountryData(hoveredCountry) : null
                  const flag = metadata?.flag || basicData?.flag
                  return flag ? <span className="text-3xl drop-shadow-lg">{flag}</span> : null
                })()}
                <div className="flex-1">
                  <div className={`font-bold text-sm tracking-wide uppercase ${metadata ? 'text-cyan-300' : 'text-gray-300'}`} style={{ textShadow: metadata ? '0 0 15px rgba(0, 255, 255, 0.8), 0 0 30px rgba(0, 255, 255, 0.4)' : 'none' }}>
                    {(() => {
                      const basicData = hoveredCountry ? getBasicCountryData(hoveredCountry) : null
                      return metadata?.name || basicData?.name || hoveredCountryName || hoveredCountry
                    })()}
                  </div>
                  <div className="text-amber-500 text-[10px] tracking-widest font-mono mt-0.5" style={{ textShadow: '0 0 10px rgba(255, 176, 0, 0.6)' }}>
                    [{hoveredCountry}] GEOLOCATION
                  </div>
                </div>
              </div>
              
              {/* Data Section - Show detailed data if metadata exists */}
              {metadata ? (
                <div className="space-y-2 text-[11px]">
                  {/* Basic Info Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gradient-to-br from-cyan-950/40 to-cyan-900/20 px-2 py-1.5 rounded border border-cyan-700/50 backdrop-blur-sm">
                      <div className="text-cyan-500 uppercase text-[9px] tracking-widest mb-1 font-bold" style={{ textShadow: '0 0 8px rgba(0, 255, 255, 0.5)' }}>
                        POPULATION
                      </div>
                      <div className="text-cyan-100 font-bold text-[11px]">{metadata.population || 'N/A'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-950/40 to-cyan-900/20 px-2 py-1.5 rounded border border-cyan-700/50 backdrop-blur-sm">
                      <div className="text-cyan-500 uppercase text-[9px] tracking-widest mb-1 font-bold" style={{ textShadow: '0 0 8px rgba(0, 255, 255, 0.5)' }}>
                        AREA
                      </div>
                      <div className="text-cyan-100 font-bold text-[11px]">{metadata.area || 'N/A'}</div>
                    </div>
                  </div>

                  {metadata.avgAge && (
                    <div className="bg-gradient-to-br from-amber-950/30 to-amber-900/10 px-2 py-1.5 rounded border border-amber-700/50">
                      <div className="text-amber-400 uppercase text-[9px] tracking-widest font-bold" style={{ textShadow: '0 0 8px rgba(255, 176, 0, 0.5)' }}>
                        AVG AGE
                      </div>
                      <div className="text-amber-100 font-semibold text-[11px] mt-0.5">{metadata.avgAge}</div>
                    </div>
                  )}

                  {metadata.waterRemaining && (
                    <div className="bg-gradient-to-br from-blue-950/30 to-blue-900/10 px-2 py-1.5 rounded border border-blue-700/50">
                      <div className="text-blue-400 uppercase text-[9px] tracking-widest font-bold" style={{ textShadow: '0 0 8px rgba(59, 130, 246, 0.5)' }}>
                        💧 WATER RESOURCES
                      </div>
                      <div className="text-blue-100 font-semibold text-[11px] mt-0.5">{metadata.waterRemaining}</div>
                    </div>
                  )}

                  {/* Military Section */}
                  {metadata.militaryPersonnel && (
                    <div className="mt-2 pt-2 border-t-2 border-amber-900/60 bg-gradient-to-br from-orange-950/20 to-amber-900/10 px-2 py-2 rounded">
                      <div className="text-amber-400 uppercase text-[9px] tracking-widest mb-2 flex items-center gap-1.5 font-bold" style={{ textShadow: '0 0 10px rgba(251, 146, 60, 0.6)' }}>
                        <span className="text-sm">🎖️</span> MILITARY FORCES
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center px-1.5">
                          <span className="text-gray-400 text-[10px]">Total Personnel:</span>
                          <span className="text-orange-300 font-bold text-[11px] bg-orange-950/50 px-2 py-0.5 rounded border border-orange-800/50">{metadata.militaryPersonnel}</span>
                        </div>
                        
                        {metadata.army && (
                          <div className="flex justify-between items-center px-1.5">
                            <span className="text-gray-400 text-[10px]">⚔️ Army:</span>
                            <span className="text-green-400 font-bold text-[11px] bg-green-950/50 px-2 py-0.5 rounded border border-green-800/50">{metadata.army}</span>
                          </div>
                        )}
                        
                        {metadata.navy && (
                          <div className="flex justify-between items-center px-1.5">
                            <span className="text-gray-400 text-[10px]">⚓ Navy:</span>
                            <span className="text-blue-400 font-bold text-[11px] bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/50">{metadata.navy}</span>
                          </div>
                        )}
                        
                        {metadata.airForce && (
                          <div className="flex justify-between items-center px-1.5">
                            <span className="text-gray-400 text-[10px]">✈️ Air Force:</span>
                            <span className="text-sky-400 font-bold text-[11px] bg-sky-950/50 px-2 py-0.5 rounded border border-sky-800/50">{metadata.airForce}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Conflict Impact Section */}
                  {(metadata.populationLoss || metadata.gdpLoss || metadata.infrastructureDamage) && (
                    <div className="mt-2 pt-2 border-t-2 border-red-900/60 bg-gradient-to-br from-red-950/20 to-red-900/10 px-2 py-2 rounded">
                      <div className="text-red-400 uppercase text-[9px] tracking-widest mb-2 flex items-center gap-1.5 font-bold" style={{ textShadow: '0 0 10px rgba(239, 68, 68, 0.6)' }}>
                        <span className="animate-pulse text-sm">⚠</span> CONFLICT IMPACT
                      </div>
                      
                      <div className="space-y-1.5">
                        {metadata.populationLoss && (
                          <div className="flex justify-between items-center px-1.5">
                            <span className="text-gray-400 text-[10px]">Population Loss:</span>
                            <span className="text-red-400 font-bold text-[11px] bg-red-950/50 px-2 py-0.5 rounded border border-red-800/50">{metadata.populationLoss}</span>
                          </div>
                        )}
                        
                        {metadata.gdpLoss && (
                          <div className="flex justify-between items-center px-1.5">
                            <span className="text-gray-400 text-[10px]">GDP Impact:</span>
                            <span className="text-orange-400 font-bold text-[11px] bg-orange-950/50 px-2 py-0.5 rounded border border-orange-800/50">{metadata.gdpLoss}</span>
                          </div>
                        )}
                        
                        {metadata.infrastructureDamage && (
                          <div className="flex justify-between items-center px-1.5">
                            <span className="text-gray-400 text-[10px]">Infrastructure:</span>
                            <span className="text-amber-400 font-bold text-[11px] bg-amber-950/50 px-2 py-0.5 rounded border border-amber-800/50">{metadata.infrastructureDamage}</span>
                          </div>
                        )}
                        
                        {metadata.resourceShift && (
                          <div className="flex justify-between items-center px-1.5">
                            <span className="text-gray-400 text-[10px]">Resources:</span>
                            <span className="text-yellow-400 font-bold text-[11px] bg-yellow-950/50 px-2 py-0.5 rounded border border-yellow-800/50">{metadata.resourceShift}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-[11px]">
                  {/* Try to get basic country data first */}
                  {(() => {
                    const basicData = hoveredCountry ? getBasicCountryData(hoveredCountry) : null
                    
                    if (basicData) {
                      return (
                        <>
                          {/* Basic Info Grid */}
                          <div className="grid grid-cols-2 gap-2">
                            <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/20 px-2 py-1.5 rounded border border-gray-600/50 backdrop-blur-sm">
                              <div className="text-gray-400 uppercase text-[9px] tracking-widest mb-1 font-bold">
                                POPULATION
                              </div>
                              <div className="text-gray-200 font-bold text-[11px]">
                                {basicData.population}
                              </div>
                            </div>
                            <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/20 px-2 py-1.5 rounded border border-gray-600/50 backdrop-blur-sm">
                              <div className="text-gray-400 uppercase text-[9px] tracking-widest mb-1 font-bold">
                                AREA
                              </div>
                              <div className="text-gray-200 font-bold text-[11px]">
                                {basicData.area}
                              </div>
                            </div>
                          </div>

                          {/* Capital */}
                          <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/10 px-2 py-1.5 rounded border border-gray-600/50">
                            <div className="text-gray-400 uppercase text-[9px] tracking-widest font-bold">
                              CAPITAL
                            </div>
                            <div className="text-gray-200 font-semibold text-[11px] mt-0.5">{basicData.capital}</div>
                          </div>

                          {/* Continent */}
                          <div className="bg-gradient-to-br from-gray-900/30 to-gray-800/10 px-2 py-1.5 rounded border border-gray-600/50">
                            <div className="text-gray-400 uppercase text-[9px] tracking-widest font-bold">
                              CONTINENT
                            </div>
                            <div className="text-gray-200 font-semibold text-[11px] mt-0.5">{basicData.continent}</div>
                          </div>
                        </>
                      )
                    } else {
                      // Fallback if no data available
                      return (
                        <div className="text-center py-3 bg-gradient-to-br from-gray-900/30 to-gray-800/10 px-2 rounded border border-gray-600/50">
                          <div className="text-gray-400 uppercase text-[9px] tracking-widest mb-1">
                            NON-CONFLICT ZONE
                          </div>
                          <div className="text-gray-300 text-[10px] font-semibold">
                            {hoveredCountryName || hoveredCountry}
                          </div>
                          <div className="text-gray-500 text-[9px] mt-1">
                            Limited data available
                          </div>
                        </div>
                      )
                    }
                  })()}
                </div>
              )}
              
              {/* Bottom accent bar */}
              <div className="mt-3 pt-2 border-t border-cyan-900/50">
                <div className="text-center text-[8px] text-gray-600 tracking-widest font-mono">
                  {metadata ? 'CLASSIFIED • LEVEL 4 CLEARANCE' : 'OPEN SOURCE GEOLOCATION'}
                </div>
              </div>
            </div>
          </div>
        </div>
          )
        })()}

      {/* Base Tooltip - Cyberpunk Dialog */}
      {hoveredBase && (
        <div
          className="font-mono text-xs pointer-events-none"
          style={{ 
            position: 'absolute',
            left: Math.min(mousePos.x + 15, 800),
            top: Math.min(mousePos.y + 15, 400),
            zIndex: 10000,
          }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-lg"></div>
          
          {/* Main dialog */}
          <div 
            className="relative bg-gradient-to-br from-black via-gray-950 to-black rounded-lg overflow-hidden min-w-[220px]"
            style={{
              border: '2px solid transparent',
              backgroundImage: 'linear-gradient(black, black), linear-gradient(135deg, #ffb000 0%, #ff0066 50%, #ffb000 100%)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
              boxShadow: '0 0 40px rgba(255, 176, 0, 0.5), 0 0 80px rgba(255, 176, 0, 0.2), inset 0 0 40px rgba(255, 176, 0, 0.05)'
            }}
          >
            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-amber-400"></div>
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-amber-400"></div>
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-red-400"></div>
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-red-400"></div>
            
            {/* Content */}
            <div className="relative p-3">
              <div className={`font-bold text-sm mb-2 uppercase tracking-wide ${hoveredBase.type === 'us' ? 'text-cyan-400' : 'text-red-400'}`} 
                   style={{ textShadow: `0 0 15px ${hoveredBase.type === 'us' ? 'rgba(0, 150, 255, 0.8)' : 'rgba(255, 0, 102, 0.8)'}, 0 0 30px ${hoveredBase.type === 'us' ? 'rgba(0, 150, 255, 0.4)' : 'rgba(255, 0, 102, 0.4)'}` }}>
                {hoveredBase.name}
              </div>
              
              <div className="text-amber-400 text-[10px] mb-2 flex items-center gap-1.5 tracking-wider" style={{ textShadow: '0 0 8px rgba(255, 176, 0, 0.6)' }}>
                <span>📍</span> {hoveredBase.country}
              </div>
              
              <div className="bg-gray-900/60 px-2 py-1.5 rounded border border-gray-700/50 backdrop-blur-sm">
                <div className="text-gray-500 text-[8px] uppercase tracking-widest mb-0.5">COORDINATES</div>
                <div className="text-gray-300 text-[10px] font-mono">
                  {hoveredBase.lat.toFixed(4)}°, {hoveredBase.lng.toFixed(4)}°
                </div>
              </div>
              
              <div className="mt-2 pt-1.5 border-t border-amber-900/50">
                <div className="text-center text-[8px] text-gray-600 tracking-widest font-mono">
                  {hoveredBase.type === 'us' ? '⭐ ALLIED FACILITY' : '🎯 TARGET LOCATION'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* API Item Tooltip */}
      {hoveredApiItem && (
        <div
          className="font-mono text-xs pointer-events-none"
          style={{ 
            position: 'absolute',
            left: Math.min(mousePos.x + 15, 800),
            top: Math.min(mousePos.y + 15, 400),
            zIndex: 10000,
          }}
        >
          {/* Glow effect */}
          <div className="absolute inset-0 blur-xl rounded-lg" style={{
            background: hoveredApiItem.type === 'fire' ? 'rgba(255, 69, 0, 0.3)' :
                       hoveredApiItem.type === 'flight' ? 'rgba(0, 191, 255, 0.3)' :
                       hoveredApiItem.type === 'earthquake' ? 'rgba(255, 215, 0, 0.3)' :
                       hoveredApiItem.type === 'nuclear' ? 'rgba(0, 255, 0, 0.3)' :
                       'rgba(138, 43, 226, 0.3)'
          }}></div>
          
          {/* Main dialog */}
          <div 
            className="relative bg-gradient-to-br from-black via-gray-950 to-black rounded-lg overflow-hidden min-w-[220px]"
            style={{
              border: '2px solid',
              borderColor: hoveredApiItem.type === 'fire' ? '#FF4500' :
                          hoveredApiItem.type === 'flight' ? '#00BFFF' :
                          hoveredApiItem.type === 'earthquake' ? '#FFD700' :
                          hoveredApiItem.type === 'nuclear' ? '#00FF00' :
                          '#8A2BE2',
              boxShadow: `0 0 30px ${hoveredApiItem.type === 'fire' ? 'rgba(255, 69, 0, 0.5)' :
                                     hoveredApiItem.type === 'flight' ? 'rgba(0, 191, 255, 0.5)' :
                                     hoveredApiItem.type === 'earthquake' ? 'rgba(255, 215, 0, 0.5)' :
                                     hoveredApiItem.type === 'nuclear' ? 'rgba(0, 255, 0, 0.5)' :
                                     'rgba(138, 43, 226, 0.5)'}`
            }}
          >
            {/* Content */}
            <div className="relative p-3">
              <div className="font-bold text-sm mb-2 uppercase tracking-wide" 
                   style={{ 
                     color: hoveredApiItem.type === 'fire' ? '#FF4500' :
                           hoveredApiItem.type === 'flight' ? '#00BFFF' :
                           hoveredApiItem.type === 'earthquake' ? '#FFD700' :
                           hoveredApiItem.type === 'nuclear' ? '#00FF00' :
                           '#8A2BE2',
                     textShadow: `0 0 15px ${hoveredApiItem.type === 'fire' ? 'rgba(255, 69, 0, 0.8)' :
                                             hoveredApiItem.type === 'flight' ? 'rgba(0, 191, 255, 0.8)' :
                                             hoveredApiItem.type === 'earthquake' ? 'rgba(255, 215, 0, 0.8)' :
                                             hoveredApiItem.type === 'nuclear' ? 'rgba(0, 255, 0, 0.8)' :
                                             'rgba(138, 43, 226, 0.8)'}`
                   }}>
                {hoveredApiItem.type === 'fire' && '🔥 FIRE DETECTION'}
                {hoveredApiItem.type === 'flight' && '✈️ MILITARY FLIGHT'}
                {hoveredApiItem.type === 'earthquake' && '🌍 EARTHQUAKE'}
                {hoveredApiItem.type === 'nuclear' && '☢️ NUCLEAR FACILITY'}
                {hoveredApiItem.type === 'military-base' && '🏛️ MILITARY BASE'}
              </div>
              
              <div className="space-y-1.5 text-[10px]">
                {hoveredApiItem.type === 'fire' && (
                  <>
                    {hoveredApiItem.data.brightness && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Brightness:</span>
                        <span className="text-orange-300 ml-2 font-bold">{hoveredApiItem.data.brightness}K</span>
                      </div>
                    )}
                    {hoveredApiItem.data.confidence && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Confidence:</span>
                        <span className="text-orange-300 ml-2 font-bold">{hoveredApiItem.data.confidence}</span>
                      </div>
                    )}
                    {hoveredApiItem.data.acq_date && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Date:</span>
                        <span className="text-gray-300 ml-2">{hoveredApiItem.data.acq_date}</span>
                      </div>
                    )}
                  </>
                )}
                
                {hoveredApiItem.type === 'flight' && (
                  <>
                    {hoveredApiItem.data.callsign && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Callsign:</span>
                        <span className="text-cyan-300 ml-2 font-bold">{hoveredApiItem.data.callsign}</span>
                      </div>
                    )}
                    {hoveredApiItem.data.altitude && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Altitude:</span>
                        <span className="text-cyan-300 ml-2">{hoveredApiItem.data.altitude} ft</span>
                      </div>
                    )}
                    {hoveredApiItem.data.speed && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Speed:</span>
                        <span className="text-cyan-300 ml-2">{hoveredApiItem.data.speed} kts</span>
                      </div>
                    )}
                    {hoveredApiItem.data.country && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Country:</span>
                        <span className="text-cyan-300 ml-2">{hoveredApiItem.data.country}</span>
                      </div>
                    )}
                  </>
                )}
                
                {hoveredApiItem.type === 'earthquake' && (
                  <>
                    {hoveredApiItem.data.magnitude && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Magnitude:</span>
                        <span className="text-yellow-300 ml-2 font-bold">{hoveredApiItem.data.magnitude}</span>
                      </div>
                    )}
                    {hoveredApiItem.data.depth && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Depth:</span>
                        <span className="text-yellow-300 ml-2">{hoveredApiItem.data.depth} km</span>
                      </div>
                    )}
                    {hoveredApiItem.data.place && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Location:</span>
                        <span className="text-gray-300 ml-2">{hoveredApiItem.data.place}</span>
                      </div>
                    )}
                  </>
                )}
                
                {hoveredApiItem.type === 'nuclear' && (
                  <>
                    {hoveredApiItem.data.name && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-green-300 ml-2 font-bold">{hoveredApiItem.data.name}</span>
                      </div>
                    )}
                    {hoveredApiItem.data.type && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-green-300 ml-2">{hoveredApiItem.data.type}</span>
                      </div>
                    )}
                    {hoveredApiItem.data.country && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Country:</span>
                        <span className="text-green-300 ml-2">{hoveredApiItem.data.country}</span>
                      </div>
                    )}
                    {hoveredApiItem.data.status && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-300 ml-2">{hoveredApiItem.data.status}</span>
                      </div>
                    )}
                  </>
                )}
                
                {hoveredApiItem.type === 'military-base' && (
                  <>
                    {hoveredApiItem.data.baseName && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Name:</span>
                        <span className="text-purple-300 ml-2 font-bold">{hoveredApiItem.data.baseName}</span>
                      </div>
                    )}
                    {hoveredApiItem.data.country && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Country:</span>
                        <span className="text-purple-300 ml-2">{hoveredApiItem.data.country}</span>
                      </div>
                    )}
                    {hoveredApiItem.data.type && (
                      <div className="bg-gray-900/60 px-2 py-1 rounded">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-purple-300 ml-2 uppercase">{hoveredApiItem.data.type}</span>
                      </div>
                    )}
                  </>
                )}
                
                <div className="bg-gray-900/60 px-2 py-1 rounded border border-gray-700/50 backdrop-blur-sm">
                  <div className="text-gray-500 text-[8px] uppercase tracking-widest mb-0.5">COORDINATES</div>
                  <div className="text-gray-300 text-[10px] font-mono">
                    {hoveredApiItem.data.latitude?.toFixed(4)}°, {hoveredApiItem.data.longitude?.toFixed(4)}°
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SVG Map */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full"
        style={{ background: '#000' }}
        onMouseMove={handleMouseMove}
      >
        {/* Definitions */}
        <defs>
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Arrow markers */}
          <marker id="arrowBlue" viewBox="0 0 10 10" refX="9" refY="3"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 3 L 0 6 z" fill="#00aaff"/>
          </marker>
          
          <marker id="arrowRed" viewBox="0 0 10 10" refX="9" refY="3"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 3 L 0 6 z" fill="#ff0066"/>
          </marker>
        </defs>

        {/* Ocean background */}
        <rect width={width} height={height} fill="#050510" />
        
        {/* Subtle ocean texture */}
        <circle cx="300" cy="250" r="200" fill="rgba(0,50,100,0.02)" opacity="0.3"/>
        <circle cx="700" cy="280" r="180" fill="rgba(0,50,100,0.02)" opacity="0.3"/>

        {/* Grid lines */}
        <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#1a1a2a" strokeWidth="1" strokeDasharray="5,5" opacity="0.3"/>
        <line x1={width/2} y1="0" x2={width/2} y2={height} stroke="#1a1a2a" strokeWidth="1" strokeDasharray="5,5" opacity="0.3"/>

        {/* Country paths from GeoJSON */}
        {worldData.features.map((feature, i) => {
          const countryId = getCountryId(feature.properties)
          const metadata = getCountryMetadata(countryId)
          const path = pathGenerator(feature) || ''
          const isHovered = hoveredCountry === countryId
          
          return (
            <motion.path
              key={i}
              d={path}
              fill={metadata?.isHighlighted ? `${metadata.highlightColor}15` : "#1a1a2e"}
              stroke={metadata?.isHighlighted ? metadata.highlightColor : "#2a3a4a"}
              strokeWidth={metadata?.isHighlighted ? "1.5" : "0.5"}
              whileHover={{ 
                fill: metadata?.isHighlighted ? `${metadata.highlightColor}40` : "rgba(255, 176, 0, 0.15)", 
                stroke: metadata?.isHighlighted ? metadata.highlightColor : "#ffb000",
                strokeWidth: "1.8"
              }}
              transition={{ duration: 0.2 }}
              onMouseEnter={(e) => handleCountryHover(countryId, feature.properties?.name || countryId, feature.properties, e as any)}
              onMouseLeave={handleCountryLeave}
              className="cursor-pointer"
              style={{
                filter: isHovered && metadata?.isHighlighted ? `drop-shadow(0 0 8px ${metadata.highlightColor})` : 'none'
              }}
            />
          )
        })}

        {/* Strike vectors FROM US bases TO Iran */}
        {militaryBases
          .filter(b => b.type === 'us' && ['pentagon', 'ramstein', 'incirlik', 'aludeid', 'bahrain', 'diego'].includes(b.id))
          .map((base, i) => {
            const target = militaryBases.find(t => t.id === 'tehran')
            if (!target) return null
            
            return (
              <path
                key={`strike-${i}`}
                d={getStrikeVector(base, target)}
                fill="none"
                stroke="#00aaff"
                strokeWidth={base.id === 'pentagon' ? 2.5 : 2}
                strokeDasharray="10,5"
                markerEnd="url(#arrowBlue)"
                opacity={0.5}
                filter="url(#glow)"
              >
                <animate attributeName="stroke-dashoffset" from="0" to="30" dur="2s" repeatCount="indefinite"/>
              </path>
            )
          })}

        {/* Counter-strike vectors FROM Iran TO nearby US bases */}
        {militaryBases
          .filter(b => b.type === 'us' && ['aludeid', 'bahrain', 'aldhafra', 'arifjan', 'jordan', 'incirlik'].includes(b.id))
          .map((base, i) => {
            const origin = militaryBases.find(t => t.id === 'tehran')
            if (!origin) return null
            
            return (
              <path
                key={`counter-${i}`}
                d={getStrikeVector(origin, base)}
                fill="none"
                stroke="#ff0066"
                strokeWidth={2}
                strokeDasharray="5,3"
                markerEnd="url(#arrowRed)"
                opacity={0.7}
              >
                <animate attributeName="stroke-dashoffset" from="0" to="16" dur={`${1.1 + i * 0.1}s`} repeatCount="indefinite"/>
              </path>
            )
          })}

        {/* Threat radius around Iran (Tehran) */}
        <circle 
          cx={iranCenterProj[0]} 
          cy={iranCenterProj[1]} 
          r="50" 
          fill="none" 
          stroke="rgba(255, 0, 102, 0.4)" 
          strokeWidth="1" 
          strokeDasharray="4,4"
        >
          <animate attributeName="r" from="50" to="75" dur="3s" repeatCount="indefinite"/>
          <animate attributeName="opacity" from="0.6" to="0" dur="3s" repeatCount="indefinite"/>
        </circle>
        
        <circle 
          cx={iranCenterProj[0]} 
          cy={iranCenterProj[1]} 
          r="30" 
          fill="rgba(255, 0, 102, 0.1)" 
          stroke="rgba(255, 0, 102, 0.5)" 
          strokeWidth="0.5"
        >
          <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite"/>
        </circle>

        {/* Military base markers */}
        {militaryBases.map((base) => {
          const [x, y] = projectPoint(base.lat, base.lng)
          
          return (
            <g 
              key={base.id} 
              onMouseEnter={(e) => handleBaseHover(base, e as any)}
              onMouseLeave={handleBaseLeave}
              className="cursor-pointer"
            >
              {base.type === 'us' ? (
                <>
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="4" 
                    fill="#00aaff" 
                    stroke="#fff" 
                    strokeWidth="0.8"
                    filter="url(#glow)"
                  >
                    <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="8" 
                    fill="none" 
                    stroke="#00aaff" 
                    strokeWidth="0.5"
                    opacity="0.4"
                  >
                    <animate attributeName="r" from="8" to="12" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
                  </circle>
                </>
              ) : (
                <>
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="4" 
                    fill="#ff0066" 
                    stroke="#fff" 
                    strokeWidth="0.8"
                    filter="url(#glow)"
                  >
                    <animate attributeName="r" values="4;5.5;4" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                  <path 
                    d={`M ${x-3},${y-3} L ${x+3},${y+3} M ${x+3},${y-3} L ${x-3},${y+3}`}
                    stroke="#ff0066" 
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                </>
              )}
            </g>
          )
        })}

        {/* API Military Bases (from external API) */}
        {apiMilitaryBases.map((base, index) => {
          const [x, y] = projectPoint(base.latitude, base.longitude)
          
          return (
            <g 
              key={`api-base-${index}`} 
              onMouseEnter={() => handleApiItemHover('military-base', base)}
              onMouseLeave={handleApiItemLeave}
              className="cursor-pointer"
            >
              <rect 
                x={x - 3} 
                y={y - 3} 
                width="6" 
                height="6" 
                fill="#8A2BE2" 
                stroke="#fff" 
                strokeWidth="0.5"
                filter="url(#glow)"
              >
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>
              </rect>
              <circle 
                cx={x} 
                cy={y} 
                r="6" 
                fill="none" 
                stroke="#8A2BE2" 
                strokeWidth="0.5"
                opacity="0.4"
              >
                <animate attributeName="r" from="6" to="10" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
              </circle>
            </g>
          )
        })}

        {/* Fire Detections */}
        {fireDetections.map((fire, index) => {
          const [x, y] = projectPoint(fire.latitude, fire.longitude)
          
          return (
            <g 
              key={`fire-${index}`} 
              onMouseEnter={() => handleApiItemHover('fire', fire)}
              onMouseLeave={handleApiItemLeave}
              className="cursor-pointer"
            >
              <circle 
                cx={x} 
                cy={y} 
                r="3" 
                fill="#FF4500" 
                stroke="#FFD700" 
                strokeWidth="0.5"
                filter="url(#glow)"
              >
                <animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite"/>
              </circle>
              <circle 
                cx={x} 
                cy={y} 
                r="5" 
                fill="none" 
                stroke="#FF4500" 
                strokeWidth="0.3"
                opacity="0.5"
              >
                <animate attributeName="r" from="5" to="8" dur="1.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite"/>
              </circle>
            </g>
          )
        })}

        {/* Military Flights */}
        {militaryFlights.map((flight, index) => {
          const [x, y] = projectPoint(flight.latitude, flight.longitude)
          
          return (
            <g 
              key={`flight-${index}`} 
              onMouseEnter={() => handleApiItemHover('flight', flight)}
              onMouseLeave={handleApiItemLeave}
              className="cursor-pointer"
            >
              {/* Aircraft symbol */}
              <path 
                d={`M ${x},${y-4} L ${x-3},${y+2} L ${x-1},${y+2} L ${x-1},${y+4} L ${x+1},${y+4} L ${x+1},${y+2} L ${x+3},${y+2} Z`}
                fill="#00BFFF" 
                stroke="#fff" 
                strokeWidth="0.5"
                filter="url(#glow)"
              >
                <animate attributeName="opacity" values="0.7;1;0.7" dur="1s" repeatCount="indefinite"/>
              </path>
              <circle 
                cx={x} 
                cy={y} 
                r="6" 
                fill="none" 
                stroke="#00BFFF" 
                strokeWidth="0.5"
                opacity="0.3"
              >
                <animate attributeName="r" from="6" to="10" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
              </circle>
            </g>
          )
        })}

        {/* Earthquakes */}
        {earthquakes.map((quake, index) => {
          const [x, y] = projectPoint(quake.latitude, quake.longitude)
          const size = quake.magnitude ? Math.max(2, Math.min(6, quake.magnitude)) : 3
          
          return (
            <g 
              key={`quake-${index}`} 
              onMouseEnter={() => handleApiItemHover('earthquake', quake)}
              onMouseLeave={handleApiItemLeave}
              className="cursor-pointer"
            >
              <circle 
                cx={x} 
                cy={y} 
                r={size} 
                fill="#FFD700" 
                stroke="#FF8C00" 
                strokeWidth="0.5"
                filter="url(#glow)"
              >
                <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle 
                cx={x} 
                cy={y} 
                r={size + 3} 
                fill="none" 
                stroke="#FFD700" 
                strokeWidth="0.5"
                opacity="0.4"
              >
                <animate attributeName="r" from={size + 3} to={size + 8} dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.4" to="0" dur="2.5s" repeatCount="indefinite"/>
              </circle>
            </g>
          )
        })}

        {/* Nuclear Facilities */}
        {nuclearFacilities.map((facility, index) => {
          const [x, y] = projectPoint(facility.latitude, facility.longitude)
          
          return (
            <g 
              key={`nuclear-${index}`} 
              onMouseEnter={() => handleApiItemHover('nuclear', facility)}
              onMouseLeave={handleApiItemLeave}
              className="cursor-pointer"
            >
              {/* Radiation symbol */}
              <circle 
                cx={x} 
                cy={y} 
                r="4" 
                fill="#00FF00" 
                stroke="#000" 
                strokeWidth="0.5"
                filter="url(#glow)"
              >
                <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite"/>
              </circle>
              <path 
                d={`M ${x},${y-3} L ${x},${y-1} M ${x-2.5},${y+1.5} L ${x-1},${y+0.5} M ${x+2.5},${y+1.5} L ${x+1},${y+0.5}`}
                stroke="#000" 
                strokeWidth="0.8"
                opacity="0.8"
              />
              <circle 
                cx={x} 
                cy={y} 
                r="7" 
                fill="none" 
                stroke="#00FF00" 
                strokeWidth="0.5"
                opacity="0.4"
              >
                <animate attributeName="r" from="7" to="11" dur="3s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.4" to="0" dur="3s" repeatCount="indefinite"/>
              </circle>
            </g>
          )
        })}

        {/* Labels for key countries */}
        <text x={projectPoint(39, -95)[0]} y={projectPoint(39, -95)[1]} 
              fontSize="14" fill="#00aaff" fontWeight="bold" fontFamily="monospace" 
              textAnchor="middle" opacity="0.9">USA</text>
        
        <text x={iranCenterProj[0]} y={iranCenterProj[1] + 70} 
              fontSize="14" fill="#ff0066" fontWeight="bold" fontFamily="monospace" 
              textAnchor="middle" opacity="0.9">IRAN</text>

        {/* Legend */}
        <rect x="20" y="340" width="340" height="165" fill="#000" stroke="#ffb000" strokeWidth="1" opacity="0.95"/>
        <text x="35" y="360" fontSize="12" fill="#ffb000" fontFamily="monospace" fontWeight="bold">⚔ GLOBAL THREAT LEGEND</text>
        
        {/* Original items */}
        <circle cx="35" cy="378" r="4" fill="#00aaff"/>
        <text x="50" y="382" fontSize="9" fill="#ccc" fontFamily="monospace">US Military Installation</text>
        
        <circle cx="35" cy="395" r="4" fill="#ff0066"/>
        <text x="50" y="399" fontSize="9" fill="#ccc" fontFamily="monospace">Strategic Target (Iran)</text>
        
        <line x1="35" y1="409" x2="65" y2="409" stroke="#00aaff" strokeWidth="2" markerEnd="url(#arrowBlue)"/>
        <text x="75" y="413" fontSize="9" fill="#ccc" fontFamily="monospace">US Strike Vector</text>
        
        {/* New API data items */}
        <rect x="33" y="421" width="6" height="6" fill="#8A2BE2" stroke="#fff" strokeWidth="0.5"/>
        <text x="50" y="428" fontSize="9" fill="#ccc" fontFamily="monospace">Military Base (Global)</text>
        
        <circle cx="35" cy="441" r="3" fill="#FF4500" stroke="#FFD700" strokeWidth="0.5"/>
        <text x="50" y="445" fontSize="9" fill="#ccc" fontFamily="monospace">Fire Detection</text>
        
        <path d="M 35,454 L 32,460 L 34,460 L 34,462 L 36,462 L 36,460 L 38,460 Z" fill="#00BFFF" stroke="#fff" strokeWidth="0.5"/>
        <text x="50" y="461" fontSize="9" fill="#ccc" fontFamily="monospace">Military Flight</text>
        
        <circle cx="35" cy="474" r="3" fill="#FFD700" stroke="#FF8C00" strokeWidth="0.5"/>
        <text x="50" y="478" fontSize="9" fill="#ccc" fontFamily="monospace">Earthquake Activity</text>
        
        <circle cx="35" cy="487" r="4" fill="#00FF00" stroke="#000" strokeWidth="0.5"/>
        <text x="50" y="491" fontSize="9" fill="#ccc" fontFamily="monospace">Nuclear Facility</text>
      </svg>
      </div>
    </div>
  )
}

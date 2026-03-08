'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { geoMercator, geoPath } from 'd3-geo'
import { zoom, zoomIdentity } from 'd3-zoom'
import { select } from 'd3-selection'
import 'd3-transition' // Import to add transition methods to selection
import { feature } from 'topojson-client'
import type { FeatureCollection, Geometry } from 'geojson'
import type { Topology } from 'topojson-specification'

interface MilitaryBase {
  id: string
  name: string
  lat: number
  lng: number
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
  baseName?: string
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

// Country metadata for tooltips (key countries only)
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
  'JPN': { name: 'Japan', population: '125,507,472', area: '377,975 km²', capital: 'Tokyo', continent: 'Asia', flag: '🇯🇵' },
  'USA': { name: 'United States', population: '331,002,651', area: '9,833,520 km²', capital: 'Washington DC', continent: 'North America', flag: '🇺🇸' },
  'IRN': { name: 'Iran', population: '83,992,949', area: '1,648,195 km²', capital: 'Tehran', continent: 'Asia', flag: '🇮🇷' },
  'ISR': { name: 'Israel', population: '9,216,900', area: '20,770 km²', capital: 'Jerusalem', continent: 'Asia', flag: '🇮🇱' },
  
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

// Name to ISO code mapping (TopoJSON only has names, not ISO codes)
const nameToIso: Record<string, string> = {
  // Asia
  'Russia': 'RUS', 'Russian Federation': 'RUS',
  'China': 'CHN',
  'India': 'IND',
  'Iran': 'IRN', 'Islamic Republic of Iran': 'IRN',
  'Israel': 'ISR',
  'Japan': 'JPN',
  'Turkey': 'TUR',
  'Afghanistan': 'AFG',
  'Pakistan': 'PAK',
  'Saudi Arabia': 'SAU',
  'Yemen': 'YEM',
  'Oman': 'OMN',
  'Iraq': 'IRQ',
  'Syria': 'SYR',
  'Lebanon': 'LBN',
  'Palestine': 'PSE',
  'Kazakhstan': 'KAZ',
  'Uzbekistan': 'UZB',
  'Turkmenistan': 'TKM',
  'Tajikistan': 'TJK',
  'Kyrgyzstan': 'KGZ',
  'Mongolia': 'MNG',
  'North Korea': 'PRK', 'Dem. Rep. Korea': 'PRK',
  'South Korea': 'KOR', 'Korea': 'KOR', 'Republic of Korea': 'KOR',
  'Vietnam': 'VNM', 'Viet Nam': 'VNM',
  'Thailand': 'THA',
  'Myanmar': 'MMR', 'Burma': 'MMR',
  'Indonesia': 'IDN',
  'Malaysia': 'MYS',
  'Philippines': 'PHL',
  // Europe
  'United Kingdom': 'GBR',
  'France': 'FRA',
  'Germany': 'DEU',
  'Italy': 'ITA',
  'Spain': 'ESP',
  'Poland': 'POL',
  'Ukraine': 'UKR',
  'Romania': 'ROU',
  'Netherlands': 'NLD',
  'Belgium': 'BEL',
  'Greece': 'GRC',
  'Czech Republic': 'CZE', 'Czechia': 'CZE',
  'Portugal': 'PRT',
  'Sweden': 'SWE',
  'Hungary': 'HUN',
  'Belarus': 'BLR',
  'Austria': 'AUT',
  'Serbia': 'SRB',
  'Switzerland': 'CHE',
  'Bulgaria': 'BGR',
  'Denmark': 'DNK',
  'Finland': 'FIN',
  'Norway': 'NOR',
  'Ireland': 'IRL',
  'Croatia': 'HRV',
  'Bosnia and Herzegovina': 'BIH', 'Bosnia and Herz.': 'BIH',
  'Albania': 'ALB',
  'Lithuania': 'LTU',
  'Slovenia': 'SVN',
  'Latvia': 'LVA',
  'Estonia': 'EST',
  // Africa
  'Egypt': 'EGY',
  'South Africa': 'ZAF',
  'Nigeria': 'NGA',
  'Ethiopia': 'ETH',
  'Tanzania': 'TZA',
  'Kenya': 'KEN',
  'Uganda': 'UGA',
  'Algeria': 'DZA',
  'Sudan': 'SDN',
  'Morocco': 'MAR',
  'Ghana': 'GHA',
  'Mozambique': 'MOZ',
  'Angola': 'AGO',
  'Cameroon': 'CMR',
  'Ivory Coast': 'CIV', "Côte d'Ivoire": 'CIV',
  'Madagascar': 'MDG',
  'Zimbabwe': 'ZWE',
  'Tunisia': 'TUN',
  'Libya': 'LBY',
  // North America
  'United States': 'USA', 'United States of America': 'USA',
  'Canada': 'CAN',
  'Mexico': 'MEX',
  'Guatemala': 'GTM',
  'Cuba': 'CUB',
  'Honduras': 'HND',
  'Nicaragua': 'NIC',
  'Costa Rica': 'CRI',
  'Panama': 'PAN',
  // South America
  'Brazil': 'BRA',
  'Colombia': 'COL',
  'Argentina': 'ARG',
  'Peru': 'PER',
  'Venezuela': 'VEN',
  'Chile': 'CHL',
  'Ecuador': 'ECU',
  'Bolivia': 'BOL',
  'Paraguay': 'PRY',
  'Uruguay': 'URY',
  // Oceania
  'Australia': 'AUS',
  'Papua New Guinea': 'PNG',
  'New Zealand': 'NZL',
}

export default function EnhancedWorldMap() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [worldData, setWorldData] = useState<FeatureCollection<Geometry> | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  
  // API data states
  const [apiMilitaryBases, setApiMilitaryBases] = useState<ApiMilitaryBaseData[]>([])
  const [fireDetections, setFireDetections] = useState<ApiFire[]>([])
  const [militaryFlights, setMilitaryFlights] = useState<ApiMilitaryFlight[]>([])
  const [earthquakes, setEarthquakes] = useState<ApiEarthquake[]>([])
  const [nuclearFacilities, setNuclearFacilities] = useState<ApiNuclearFacility[]>([])
  const [hoveredApiItem, setHoveredApiItem] = useState<{type: string, data: any} | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  
  // Country hover states
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null)
  const [hoveredCountryName, setHoveredCountryName] = useState<string | null>(null)

  // Map dimensions - larger for enhanced view
  const width = 2000
  const height = 1000

  // D3 Mercator projection
  const projection = useMemo(() => {
    return geoMercator()
      .scale(300)
      .translate([width / 2, height / 1.5])
      .center([0, 20])
  }, [])

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

  // Fetch data from APIs
  useEffect(() => {
    fetch('/api/military-bases')
      .then(res => res.json())
      .then(data => setApiMilitaryBases(data.bases || []))
      .catch(err => console.error('Error fetching military bases:', err))

    fetch('/api/fire-detections')
      .then(res => res.json())
      .then(data => setFireDetections(data.fires || []))
      .catch(err => console.error('Error fetching fire detections:', err))

    fetch('/api/military-flights')
      .then(res => res.json())
      .then(data => setMilitaryFlights(data.flights || []))
      .catch(err => console.error('Error fetching military flights:', err))

    fetch('/api/earthquakes')
      .then(res => res.json())
      .then(data => setEarthquakes(data.earthquakes || []))
      .catch(err => console.error('Error fetching earthquakes:', err))

    fetch('/api/nuclear-facilities')
      .then(res => res.json())
      .then(data => setNuclearFacilities(data.facilities || []))
      .catch(err => console.error('Error fetching nuclear facilities:', err))
  }, [])

  // Setup D3 zoom
  useEffect(() => {
    if (!svgRef.current) return

    const svg = select(svgRef.current)
    const g = svg.select('.map-group')

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 20])
      .on('zoom', (event: any) => {
        const { transform } = event
        g.attr('transform', transform)
        setTransform({ x: transform.x, y: transform.y, k: transform.k })
        setZoomLevel(parseFloat(transform.k.toFixed(2)))
      })

    svg.call(zoomBehavior as any)

    return () => {
      svg.on('.zoom', null)
    }
  }, [worldData])

  const projectPoint = (lat: number, lng: number): [number, number] => {
    const coords = projection([lng, lat])
    return coords ?? [0, 0]
  }

  // Get country ISO code from properties
  const getCountryId = (properties: any): string => {
    return properties?.['iso_a3'] || properties?.['adm0_a3'] || properties?.['iso_a2'] || properties?.['name'] || ''
  }

  // Helper to get country metadata
  const getCountryMetadata = useCallback((countryId: string) => {
    if (!countryId) return null    
    // Try direct lookup first (for ISO codes)
    if (countryMetadata[countryId]) return countryMetadata[countryId]
    const upperCaseId = countryId.toUpperCase()
    if (countryMetadata[upperCaseId]) return countryMetadata[upperCaseId]
    // Try name-to-ISO mapping
    const isoCode = nameToIso[countryId]
    if (isoCode && countryMetadata[isoCode]) return countryMetadata[isoCode]
    return null
  }, [])

  // Helper to get basic country data
  const getBasicCountryData = useCallback((countryId: string) => {
    if (!countryId) return null
    // Try direct lookup first (for ISO codes)
    if (basicCountryData[countryId]) return basicCountryData[countryId]
    const upperCaseId = countryId.toUpperCase()
    if (basicCountryData[upperCaseId]) return basicCountryData[upperCaseId]
    // Try name-to-ISO mapping
    const isoCode = nameToIso[countryId]
    if (isoCode && basicCountryData[isoCode]) return basicCountryData[isoCode]
    return null
  }, [])

  // Country hover handlers
  const handleCountryHover = useCallback((countryId: string, countryName: string, e: React.MouseEvent<SVGPathElement>) => {
    setHoveredCountry(countryId)
    setHoveredCountryName(countryName)
    // Use viewport coordinates for fixed positioning
    setMousePos({ 
      x: e.clientX, 
      y: e.clientY 
    })
  }, [])

  const handleCountryLeave = useCallback(() => {
    setHoveredCountry(null)
    setHoveredCountryName(null)
  }, [])

  const handleZoomIn = () => {
    if (!svgRef.current) return
    const svg = select(svgRef.current)
    svg.transition().call(zoom<SVGSVGElement, unknown>().scaleBy as any, 1.5)
  }

  const handleZoomOut = () => {
    if (!svgRef.current) return
    const svg = select(svgRef.current)
    svg.transition().call(zoom<SVGSVGElement, unknown>().scaleBy as any, 0.67)
  }

  const handleResetZoom = () => {
    if (!svgRef.current) return
    const svg = select(svgRef.current)
    svg.transition().call(zoom<SVGSVGElement, unknown>().transform as any, zoomIdentity)
  }

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    // Use viewport coordinates for fixed positioning
    setMousePos({ 
      x: event.clientX, 
      y: event.clientY 
    })
  }

  if (!worldData) {
    return (
      <div className="flex items-center justify-center h-[800px] bg-black text-cyan-400 font-mono border-2 border-cyan-900 rounded-lg">
        <div className="text-center">
          <div className="animate-pulse text-3xl mb-4">⚡ LOADING ENHANCED MAP ⚡</div>
          <div className="text-sm opacity-60">Initializing geographic data and systems...</div>
        </div>
      </div>
    )
  }

  // Performance optimization: disable animations at high zoom levels
  const shouldAnimate = zoomLevel < 5

  return (
    <div className="relative">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-50 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="bg-black/90 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black px-4 py-2 font-mono font-bold transition-all shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400"
        >
          <span className="text-2xl">+</span>
        </button>
        <button
          onClick={handleZoomOut}
          className="bg-black/90 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-black px-4 py-2 font-mono font-bold transition-all shadow-lg shadow-cyan-500/50 hover:shadow-cyan-400"
        >
          <span className="text-2xl">−</span>
        </button>
        <button
          onClick={handleResetZoom}
          className="bg-black/90 border-2 border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-black px-3 py-2 font-mono text-xs font-bold transition-all shadow-lg shadow-amber-500/50 hover:shadow-amber-400"
        >
          RESET
        </button>
        <div className="bg-black/90 border-2 border-gray-600 px-3 py-2 text-center">
          <div className="text-gray-400 text-xs font-mono mb-1">ZOOM</div>
          <div className="text-cyan-300 text-lg font-mono font-bold">{zoomLevel}×</div>
        </div>
      </div>

      {/* Legend Panel - Right Side */}
      <div className="absolute top-4 left-4 z-50 bg-black/95 border-2 border-cyber-amber/70 rounded-lg shadow-2xl shadow-amber-500/30 max-w-sm">
        <div className="bg-gradient-to-r from-amber-900/50 to-amber-800/30 px-4 py-2 border-b-2 border-amber-600/50">
          <h3 className="text-cyber-amber font-mono font-bold text-sm tracking-wider flex items-center gap-2">
            <span className="text-lg">⚔</span>
            GLOBAL THREAT LEGEND
          </h3>
        </div>
        
        <div className="p-4 space-y-3">
          {/* Original US/Iran markers */}
          <div className="space-y-2 pb-3 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" className="flex-shrink-0">
                <circle cx="8" cy="8" r="5" fill="#00aaff" stroke="#fff" strokeWidth="1"/>
              </svg>
              <span className="text-gray-300 text-xs font-mono">US Military Installation</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" className="flex-shrink-0">
                <circle cx="8" cy="8" r="5" fill="#ff0066" stroke="#fff" strokeWidth="1"/>
              </svg>
              <span className="text-gray-300 text-xs font-mono">Strategic Target (Iran)</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="30" height="16" className="flex-shrink-0">
                <line x1="0" y1="8" x2="25" y2="8" stroke="#00aaff" strokeWidth="2"/>
                <polygon points="25,8 20,5 20,11" fill="#00aaff"/>
              </svg>
              <span className="text-gray-300 text-xs font-mono">US Strike Vector</span>
            </div>
          </div>

          {/* API Data markers */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <svg width="16" height="16" className="flex-shrink-0">
                <rect x="5" y="5" width="6" height="6" fill="#8A2BE2" stroke="#fff" strokeWidth="0.5"/>
              </svg>
              <span className="text-gray-300 text-xs font-mono">Military Base (Global)</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" className="flex-shrink-0">
                <circle cx="8" cy="8" r="4" fill="#FF4500" stroke="#FFD700" strokeWidth="1"/>
              </svg>
              <span className="text-gray-300 text-xs font-mono">Fire Detection</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" className="flex-shrink-0">
                <path d="M 8,4 L 5,10 L 7,10 L 7,12 L 9,12 L 9,10 L 11,10 Z" fill="#00BFFF" stroke="#fff" strokeWidth="0.5"/>
              </svg>
              <span className="text-gray-300 text-xs font-mono">Military Flight</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" className="flex-shrink-0">
                <circle cx="8" cy="8" r="4" fill="#FFD700" stroke="#FF8C00" strokeWidth="1"/>
              </svg>
              <span className="text-gray-300 text-xs font-mono">Earthquake Activity</span>
            </div>
            <div className="flex items-center gap-3">
              <svg width="16" height="16" className="flex-shrink-0">
                <circle cx="8" cy="8" r="5" fill="#00FF00" stroke="#000" strokeWidth="0.5"/>
                <path d="M 8,5 L 8,7 M 5.5,9.5 L 7,8.5 M 10.5,9.5 L 9,8.5" stroke="#000" strokeWidth="1"/>
              </svg>
              <span className="text-gray-300 text-xs font-mono">Nuclear Facility</span>
            </div>
          </div>

          {/* Data counts */}
          <div className="pt-3 border-t border-gray-700">
            <div className="text-[10px] text-gray-500 font-mono space-y-1">
              <div className="flex justify-between">
                <span>Military Bases:</span>
                <span className="text-purple-400 font-bold">{apiMilitaryBases.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Earthquakes:</span>
                <span className="text-yellow-400 font-bold">{earthquakes.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Nuclear Sites:</span>
                <span className="text-green-400 font-bold">{nuclearFacilities.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Fire Detections:</span>
                <span className="text-orange-400 font-bold">{fireDetections.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Military Flights:</span>
                <span className="text-cyan-400 font-bold">{militaryFlights.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel - Bottom Left */}
      <div className="absolute bottom-4 left-4 z-50 bg-black/95 border-2 border-cyan-500/70 rounded-lg shadow-2xl shadow-cyan-500/30 max-w-md">
        <div className="bg-gradient-to-r from-cyan-900/50 to-cyan-800/30 px-4 py-2 border-b-2 border-cyan-600/50">
          <h3 className="text-cyan-400 font-mono font-bold text-sm tracking-wider flex items-center gap-2">
            <span className="text-lg">🎮</span>
            INTERACTIVITY GUIDE
          </h3>
        </div>
        <div className="p-4">
          <ul className="text-gray-300 text-xs font-mono space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 flex-shrink-0">•</span>
              <span><span className="text-cyan-300 font-bold">Mouse Wheel:</span> Zoom in/out</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 flex-shrink-0">•</span>
              <span><span className="text-cyan-300 font-bold">Click + Drag:</span> Pan around map</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 flex-shrink-0">•</span>
              <span><span className="text-cyan-300 font-bold">Hover Markers:</span> View detailed info</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 flex-shrink-0">•</span>
              <span><span className="text-cyan-300 font-bold">Buttons:</span> Precise zoom control</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredApiItem && (
        <div
          className="fixed pointer-events-none z-[100]"
          style={{ 
            left: mousePos.x + 15,
            top: mousePos.y + 15,
          }}
        >
          <div className="bg-black/95 border-2 border-cyan-500 rounded p-3 shadow-2xl shadow-cyan-500/50 max-w-xs">
            <div className="font-mono text-cyan-300 font-bold text-sm mb-2">
              {hoveredApiItem.type === 'military-base' && '🏛️ MILITARY BASE'}
              {hoveredApiItem.type === 'fire' && '🔥 FIRE DETECTION'}
              {hoveredApiItem.type === 'flight' && '✈️ MILITARY FLIGHT'}
              {hoveredApiItem.type === 'earthquake' && '🌍 EARTHQUAKE'}
              {hoveredApiItem.type === 'nuclear' && '☢️ NUCLEAR FACILITY'}
            </div>
            <div className="text-xs text-gray-300 space-y-1">
              {hoveredApiItem.data.baseName && (
                <div><span className="text-gray-500">Name:</span> {hoveredApiItem.data.baseName}</div>
              )}
              {hoveredApiItem.data.name && (
                <div><span className="text-gray-500">Name:</span> {hoveredApiItem.data.name}</div>
              )}
              {hoveredApiItem.data.country && (
                <div><span className="text-gray-500">Country:</span> {hoveredApiItem.data.country}</div>
              )}
              {hoveredApiItem.data.magnitude && (
                <div><span className="text-gray-500">Magnitude:</span> {hoveredApiItem.data.magnitude}</div>
              )}
              {hoveredApiItem.data.place && (
                <div><span className="text-gray-500">Location:</span> {hoveredApiItem.data.place}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Country Tooltip */}
      {hoveredCountry && (() => {
        const metadata = getCountryMetadata(hoveredCountry)
        const basicData = getBasicCountryData(hoveredCountry)
        const flag = metadata?.flag || basicData?.flag
        const displayName = metadata?.name || basicData?.name || hoveredCountryName || hoveredCountry
        
        return (
          <div
            className="fixed pointer-events-none z-[100] font-mono text-xs max-w-[320px]"
            style={{ 
              left: Math.min(mousePos.x + 15, window.innerWidth - 340),
              top: Math.min(mousePos.y + 15, window.innerHeight - 250),
            }}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-lg"></div>
            
            {/* Main dialog */}
            <div 
              className="relative bg-gradient-to-br from-black via-gray-950 to-black rounded-lg overflow-hidden border-2"
              style={{
                borderColor: metadata?.isHighlighted ? metadata.highlightColor : '#4a5568',
                boxShadow: metadata?.isHighlighted 
                  ? `0 0 30px ${metadata.highlightColor}40, 0 0 60px ${metadata.highlightColor}20` 
                  : '0 0 20px rgba(100, 116, 139, 0.3)'
              }}
            >
              {/* Scanline effect */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)',
              }}></div>
              
              {/* Content */}
              <div className="relative p-3">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-cyan-800/60">
                  {flag && <span className="text-2xl">{flag}</span>}
                  <div className="flex-1">
                    <div 
                      className={`font-bold text-sm uppercase ${metadata?.isHighlighted ? 'text-cyan-300' : 'text-gray-300'}`}
                      style={{ textShadow: metadata?.isHighlighted ? '0 0 10px rgba(0, 255, 255, 0.6)' : 'none' }}
                    >
                      {displayName}
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
                ) : basicData ? (
                  <div className="space-y-2 text-[11px]">
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
                  </div>
                ) : (
                  <div className="text-center py-3 bg-gradient-to-br from-gray-900/30 to-gray-800/10 px-2 rounded border border-gray-600/50">
                    <div className="text-gray-400 uppercase text-[9px] tracking-widest mb-1">
                      NON-CONFLICT ZONE
                    </div>
                    <div className="text-gray-300 text-[10px] font-semibold">
                      {displayName}
                    </div>
                    <div className="text-gray-500 text-[9px] mt-1">
                      Limited data available
                    </div>
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

      {/* SVG Map */}
      <div className="w-full bg-black border-2 border-cyan-900 rounded-lg overflow-hidden shadow-2xl shadow-cyan-900/50" style={{ height: 'calc(100vh - 200px)' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full cursor-move"
          preserveAspectRatio="xMidYMid meet"
          style={{ background: '#000' }}
          onMouseMove={handleMouseMove}
        >
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            
            {/* Arrow markers for strike vectors */}
            <marker id="arrowBlue" viewBox="0 0 10 10" refX="9" refY="3"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 3 L 0 6 z" fill="#00aaff"/>
            </marker>
            
            <marker id="arrowRed" viewBox="0 0 10 10" refX="9" refY="3"
                    markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 3 L 0 6 z" fill="#ff0066"/>
            </marker>
          </defs>

          <g className="map-group">
            {/* Ocean background */}
            <rect width={width} height={height} fill="#050510" />

            {/* Subtle ocean texture */}
            <circle cx="500" cy="400" r="300" fill="rgba(0,50,100,0.02)" opacity="0.3"/>
            <circle cx="1500" cy="500" r="250" fill="rgba(0,50,100,0.02)" opacity="0.3"/>

            {/* Grid lines */}
            <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#1a1a2a" strokeWidth="1" strokeDasharray="10,10" opacity="0.3"/>
            <line x1={width/2} y1="0" x2={width/2} y2={height} stroke="#1a1a2a" strokeWidth="1" strokeDasharray="10,10" opacity="0.3"/>

            {/* Countries */}
            {worldData.features.map((feature, i) => {
              const path = pathGenerator(feature) || ''
              const countryId = getCountryId(feature.properties)
              const metadata = getCountryMetadata(countryId)
              const isHovered = hoveredCountry === countryId
              
              return (
                <path
                  key={i}
                  d={path}
                  fill={isHovered 
                    ? (metadata?.isHighlighted ? `${metadata.highlightColor}40` : "rgba(255, 176, 0, 0.15)")
                    : (metadata?.isHighlighted ? `${metadata.highlightColor}15` : "#1a1a2e")
                  }
                  stroke={isHovered
                    ? (metadata?.isHighlighted ? metadata.highlightColor : "#ffb000")
                    : (metadata?.isHighlighted ? metadata.highlightColor : "#2a3a4a")
                  }
                  strokeWidth={isHovered ? "1.8" : (metadata?.isHighlighted ? "1.5" : "0.5")}
                  className="transition-all duration-200 cursor-pointer"
                  style={{
                    filter: isHovered && metadata?.isHighlighted ? `drop-shadow(0 0 8px ${metadata.highlightColor})` : 'none'
                  }}
                  onMouseEnter={(e) => handleCountryHover(countryId, feature.properties?.name || countryId, e)}
                  onMouseLeave={handleCountryLeave}
                />
              )
            })}

            {/* Strike vectors FROM US bases TO Iran */}
            {militaryBases
              .filter(b => b.type === 'us' && ['pentagon', 'ramstein', 'incirlik', 'aludeid', 'bahrain', 'diego'].includes(b.id))
              .map((base, i) => {
                const target = militaryBases.find(t => t.id === 'tehran')
                if (!target) return null
                
                const [x1, y1] = projectPoint(base.lat, base.lng)
                const [x2, y2] = projectPoint(target.lat, target.lng)
                const midX = (x1 + x2) / 2
                const midY = Math.min(y1, y2) - 100
                
                return (
                  <path
                    key={`strike-${i}`}
                    d={`M ${x1},${y1} Q ${midX},${midY} ${x2},${y2}`}
                    fill="none"
                    stroke="#00aaff"
                    strokeWidth={base.id === 'pentagon' ? 2.5 : 2}
                    strokeDasharray="10,5"
                    markerEnd="url(#arrowBlue)"
                    opacity={0.5}
                    filter="url(#glow)"
                  >
                    {shouldAnimate && <animate attributeName="stroke-dashoffset" from="0" to="30" dur="2s" repeatCount="indefinite"/>}
                  </path>
                )
              })}

            {/* Counter-strike vectors FROM Iran TO nearby US bases */}
            {militaryBases
              .filter(b => b.type === 'us' && ['aludeid', 'bahrain', 'aldhafra', 'arifjan', 'jordan', 'incirlik'].includes(b.id))
              .map((base, i) => {
                const origin = militaryBases.find(t => t.id === 'tehran')
                if (!origin) return null
                
                const [x1, y1] = projectPoint(origin.lat, origin.lng)
                const [x2, y2] = projectPoint(base.lat, base.lng)
                const midX = (x1 + x2) / 2
                const midY = Math.min(y1, y2) - 80
                
                return (
                  <path
                    key={`counter-${i}`}
                    d={`M ${x1},${y1} Q ${midX},${midY} ${x2},${y2}`}
                    fill="none"
                    stroke="#ff0066"
                    strokeWidth={2}
                    strokeDasharray="5,3"
                    markerEnd="url(#arrowRed)"
                    opacity={0.7}
                  >
                    {shouldAnimate && <animate attributeName="stroke-dashoffset" from="0" to="16" dur={`${1.1 + i * 0.1}s`} repeatCount="indefinite"/>}
                  </path>
                )
              })}

            {/* Threat radius around Iran */}
            {(() => {
              const iranCenter = militaryBases.find(b => b.id === 'tehran')
              if (!iranCenter) return null
              const [x, y] = projectPoint(iranCenter.lat, iranCenter.lng)
              
              return (
                <>
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="100" 
                    fill="none" 
                    stroke="rgba(255, 0, 102, 0.4)" 
                    strokeWidth="1" 
                    strokeDasharray="4,4"
                  >
                    {shouldAnimate && (<>
                      <animate attributeName="r" from="100" to="150" dur="3s" repeatCount="indefinite"/>
                      <animate attributeName="opacity" from="0.6" to="0" dur="3s" repeatCount="indefinite"/>
                    </>)}
                  </circle>
                  
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="60" 
                    fill="rgba(255, 0, 102, 0.1)" 
                    stroke="rgba(255, 0, 102, 0.5)" 
                    strokeWidth="0.5"
                  >
                    {shouldAnimate && <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite"/>}
                  </circle>
                </>
              )
            })()}

            {/* Original military base markers */}
            {militaryBases.map((base) => {
              const [x, y] = projectPoint(base.lat, base.lng)
              
              return (
                <g key={base.id} className="cursor-pointer">
                  {base.type === 'us' ? (
                    <>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="6" 
                        fill="#00aaff" 
                        stroke="#fff" 
                        strokeWidth="1"
                        filter="url(#glow)"
                      >
                        {shouldAnimate && <animate attributeName="r" values="6;7;6" dur="2s" repeatCount="indefinite"/>}
                      </circle>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="10" 
                        fill="none" 
                        stroke="#00aaff" 
                        strokeWidth="0.5"
                        opacity="0.4"
                      >
                        {shouldAnimate && (<>
                          <animate attributeName="r" from="10" to="16" dur="2s" repeatCount="indefinite"/>
                          <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite"/>
                        </>)}
                      </circle>
                    </>
                  ) : (
                    <>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r="6" 
                        fill="#ff0066" 
                        stroke="#fff" 
                        strokeWidth="1"
                        filter="url(#glow)"
                      >
                        {shouldAnimate && <animate attributeName="r" values="6;7.5;6" dur="1.5s" repeatCount="indefinite"/>}
                      </circle>
                      <path 
                        d={`M ${x-4},${y-4} L ${x+4},${y+4} M ${x+4},${y-4} L ${x-4},${y+4}`}
                        stroke="#ff0066" 
                        strokeWidth="2"
                        opacity="0.7"
                      />
                    </>
                  )}
                </g>
              )
            })}

            {/* API Military Bases */}
            {apiMilitaryBases.map((base, index) => {
              const [x, y] = projectPoint(base.latitude, base.longitude)
              return (
                <rect 
                  key={`api-base-${index}`} 
                  x={x - 3} 
                  y={y - 3} 
                  width="6" 
                  height="6" 
                  fill="#8A2BE2" 
                  stroke="#fff" 
                  strokeWidth="0.5"
                  filter="url(#glow)"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredApiItem({ type: 'military-base', data: base })}
                  onMouseLeave={() => setHoveredApiItem(null)}
                >
                  {shouldAnimate && <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite"/>}
                </rect>
              )
            })}

            {/* Fires */}
            {fireDetections.map((fire, index) => {
              const [x, y] = projectPoint(fire.latitude, fire.longitude)
              return (
                <circle 
                  key={`fire-${index}`} 
                  cx={x} 
                  cy={y} 
                  r="3" 
                  fill="#FF4500" 
                  stroke="#FFD700" 
                  strokeWidth="0.5"
                  filter="url(#glow)"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredApiItem({ type: 'fire', data: fire })}
                  onMouseLeave={() => setHoveredApiItem(null)}
                />
              )
            })}

            {/* Earthquakes */}
            {earthquakes.map((quake, index) => {
              const [x, y] = projectPoint(quake.latitude, quake.longitude)
              const size = quake.magnitude ? Math.max(2, Math.min(8, quake.magnitude)) : 3
              return (
                <circle 
                  key={`quake-${index}`} 
                  cx={x} 
                  cy={y} 
                  r={size} 
                  fill="#FFD700" 
                  stroke="#FF8C00" 
                  strokeWidth="0.5"
                  filter="url(#glow)"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredApiItem({ type: 'earthquake', data: quake })}
                  onMouseLeave={() => setHoveredApiItem(null)}
                />
              )
            })}

            {/* Nuclear Facilities */}
            {nuclearFacilities.map((facility, index) => {
              const [x, y] = projectPoint(facility.latitude, facility.longitude)
              return (
                <g 
                  key={`nuclear-${index}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredApiItem({ type: 'nuclear', data: facility })}
                  onMouseLeave={() => setHoveredApiItem(null)}
                >
                  <circle 
                    cx={x} 
                    cy={y} 
                    r="4" 
                    fill="#00FF00" 
                    stroke="#000" 
                    strokeWidth="0.5"
                    filter="url(#glow)"
                  />
                  <path 
                    d={`M ${x},${y-3} L ${x},${y-1} M ${x-2.5},${y+1.5} L ${x-1},${y+0.5} M ${x+2.5},${y+1.5} L ${x+1},${y+0.5}`}
                    stroke="#000" 
                    strokeWidth="0.8"
                  />
                </g>
              )
            })}

            {/* Military Flights */}
            {militaryFlights.map((flight, index) => {
              const [x, y] = projectPoint(flight.latitude, flight.longitude)
              return (
                <path 
                  key={`flight-${index}`}
                  d={`M ${x},${y-4} L ${x-3},${y+2} L ${x-1},${y+2} L ${x-1},${y+4} L ${x+1},${y+4} L ${x+1},${y+2} L ${x+3},${y+2} Z`}
                  fill="#00BFFF" 
                  stroke="#fff" 
                  strokeWidth="0.5"
                  filter="url(#glow)"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredApiItem({ type: 'flight', data: flight })}
                  onMouseLeave={() => setHoveredApiItem(null)}
                />
              )
            })}
          </g>
        </svg>
      </div>
    </div>
  )
}

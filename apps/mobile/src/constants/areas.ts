export interface Area {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
  areas: Area[];
}

export const CITIES: City[] = [
  {
    id: 'seoul',
    name: '서울',
    areas: [
      { id: 'seoul_station', name: '서울역' },
      { id: 'hongdae', name: '홍대' },
      { id: 'hapjeong', name: '합정' },
      { id: 'itaewon', name: '이태원' },
      { id: 'myeongdong', name: '명동' },
      { id: 'dongdaemun', name: '동대문' },
      { id: 'seongsu', name: '성수' },
      { id: 'konkuk', name: '건대' },
      { id: 'jongno', name: '종로' },
      { id: 'gyeongbokgung', name: '경복궁' },
      { id: 'gwanghwamun', name: '광화문' },
      { id: 'ichon', name: '이촌' },
      { id: 'yeouido', name: '여의도' },
      { id: 'incheon_airport', name: '인천공항' },
      { id: 'gimpo_airport', name: '김포공항' },
    ],
  },
];

export const MAX_AREAS = 3;

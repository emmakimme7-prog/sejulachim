-- 카테고리 체크 제약 갱신: 옛(취미/가족) → 새(실생활/관계)
-- 2026-04-19: 실생활/관계 선택 시 INSERT가 실패하던 버그 수정

-- 1) 기존 데이터 마이그레이션 (가족 → 관계, 취미 → 실생활)
--    먼저 check 제약을 풀고 데이터를 옮긴 뒤 다시 잠근다.

alter table content_items
  drop constraint if exists content_items_category_check;

alter table user_interest_selections
  drop constraint if exists user_interest_selections_main_interest_check;

update content_items
   set category = '관계'
 where category = '가족';

update content_items
   set category = '실생활'
 where category = '취미';

update user_interest_selections
   set main_interest = '관계'
 where main_interest = '가족';

update user_interest_selections
   set main_interest = '실생활'
 where main_interest = '취미';

-- 2) 새 카테고리 집합으로 check 제약 재추가

alter table content_items
  add constraint content_items_category_check
  check (category in ('건강', '돈', '실생활', '뉴스', '관계'));

alter table user_interest_selections
  add constraint user_interest_selections_main_interest_check
  check (main_interest in ('건강', '돈', '실생활', '뉴스', '관계'));

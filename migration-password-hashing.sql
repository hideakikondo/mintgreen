
SELECT voter_id, display_name, 
       CASE 
           WHEN password LIKE '%:%' THEN 'ハッシュ化済み'
           ELSE '平文'
       END as password_status
FROM voters;

SELECT COUNT(*) as plaintext_password_count
FROM voters 
WHERE password NOT LIKE '%:%';

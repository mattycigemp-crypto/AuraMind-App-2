STEP 1: Table Schema

| column_name             | data_type                |
| ----------------------- | ------------------------ |
| id                      | uuid                     |
| deck_id                 | uuid                     |
| front                   | text                     |
| back                    | text                     |
| next_review_at          | timestamp with time zone |
| interval_days           | integer                  |
| ease_factor             | real                     |
| repetitions             | integer                  |
| created_at              | timestamp with time zone |
| updated_at              | timestamp with time zone |
| custom_interval_minutes | integer                  |
| user_id                 | uuid                     |
| fsrs_state              | jsonb                    |
| verified                | boolean                  |
| next_review             | timestamp with time zone |
| interval                | integer                  |
| repetition              | integer                  |
| last_reviewed           | timestamp with time zone |
| source_type             | text                     |
| trust_score             | numeric                  |

STEP 2:

| id                                   | user_id                              | front |
| ------------------------------------ | ------------------------------------ | ----- |
| 1a086b3f-c335-4d92-85e4-b8f2572f9dd6 | a4c893a2-fb6f-4110-8ada-4adfdad4e0d7 | test  |

STEP 3: User Authentication

| uid  |
| ---- |
| null |

STEP 4: RLS Status

| table | rls_enabled |
| ----- | ------------ |
| cards | true         |

| schemaname | tablename | policyname                          | permissive | roles           | cmd    | qual                                                                                                                      | with_check                                                                                                                |
| ---------- | --------- | ----------------------------------- | ---------- | --------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| public     | cards     | Users can create cards in own decks | PERMISSIVE | {authenticated} | INSERT | null                                                                                                                      | (EXISTS ( SELECT 1
   FROM decks
  WHERE ((decks.id = cards.deck_id) AND (decks.user_id = ( SELECT auth.uid() AS uid))))) |
| public     | cards     | Users can create own cards          | PERMISSIVE | {public}        | INSERT | null                                                                                                                      | (auth.uid() = user_id)                                                                                                    |
| public     | cards     | Users can delete cards in own decks | PERMISSIVE | {authenticated} | DELETE | (EXISTS ( SELECT 1
   FROM decks
    WHERE ((decks.id = cards.deck_id) AND (decks.user_id = ( SELECT auth.uid() AS uid))))) | null                                                                                                                      |
| public     | cards     | Users can delete own cards          | PERMISSIVE | {public}        | DELETE | (auth.uid() = user_id)                                                                                                    | null                                                                                                                      |
| public     | cards     | Users can insert own cards          | PERMISSIVE | {public}        | INSERT | null                                                                                                                      | (auth.uid() = user_id)                                                                                                    |
| public     | cards     | Users can update cards in own decks | PERMISSIVE | {authenticated} | UPDATE | (EXISTS ( SELECT 1
   FROM decks
  WHERE ((decks.id = cards.deck_id) AND (decks.user_id = ( SELECT auth.uid() AS uid))))) | (EXISTS ( SELECT 1
   FROM decks
  WHERE ((decks.id = cards.deck_id) AND (decks.user_id = ( SELECT auth.uid() AS uid))))) |
| public     | cards     | Users can update own cards          | PERMISSIVE | {public}        | UPDATE | (auth.uid() = user_id)                                                                                                    | null                                                                                                                      |
| public     | cards     | Users can view cards from own decks | PERMISSIVE | {authenticated} | SELECT | (EXISTS ( SELECT 1
   FROM decks
  WHERE ((decks.id = cards.deck_id) AND (decks.user_id = ( SELECT auth.uid() AS uid))))) | null                                                                                                                      |
| public     | cards     | Users can view own cards            | PERMISSIVE | {public}        | SELECT | (auth.uid() = user_id)                                                                                                    | null                                                                                                                      |

STEP 4:

Success. No rows returned.
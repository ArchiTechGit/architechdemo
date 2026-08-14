-- Internal rename only: schema/function/file/type names go from "alayacare" to
-- "archicare" to match the branded UI. The real captured wire format
-- (/AlayaCare/v1/... path, alayacare_visit_id/alayacare_service_id field
-- names) is left untouched -- renaming those would break fidelity to the
-- real system's actual API shape, which is the point of this project.
alter schema alayacare rename to archicare;

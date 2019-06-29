--[[
	/****************************************************************************
	 * pseb-propy.lua - Copyright 2017 Pu-Feng Du, Ph.D.                        *
	 *                                                                          *
	 * This file is a part of the software: UltraPse                            *
	 * UltraPse is free software: you can redistribute it and/or modify         *
	 * it under the terms of the GNU General Public License as published by     *
	 * the Free Software Foundation, either version 3 of the License, or        *
	 * (at your option) any later version.                                      *
	 *                                                                          *
	 * UltraPse is distributed in the hope that it will be useful,              *
	 * but WITHOUT ANY WARRANTY; without even the implied warranty of           *
	 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the            *
	 * GNU General Public License for more details.                             *
	 *                                                                          *
	 * You should have received a copy of the GNU General Public License        *
	 * along with UltraPse.  If not, see <http://www.gnu.org/licenses/>.        *
	 ****************************************************************************/

	 Legacy scripts from PseAAC-General
--]]

--[[
	This scripts was updated on Oct. 9th, 2017.
	Add some lines to make it compatible with UltraPse.
	Most contents are identical to those in PseAAC-General.
	The usage of the script is identical to PseAAC-General.
	This scripts provide the following modes:
		CTD Composition
		quasi-Sequence Order Effect
		Normalized Moreau-Broto auto-coefficients
		Geary coefficients
		Moran coefficients
	
	Synopsis:
		./upse -u tdfs/pseb-propy.lua -i test/tiny.fas -f svm -l 10 -w 1
--]]

--[[
    This script implements some feautures of Propy : http://code.google.com/p/protpy/
        as well as protr http://cran.r-project.org/web/packages/protr/index.html
--]]

AATable =
{
    ["A"]=1,["C"]=2,["D"]=3,["E"]=4,
    ["F"]=5,["G"]=6,["H"]=7,["I"]=8,
    ["K"]=9,["L"]=10,["M"]=11,["N"]=12,
    ["P"]=13,["Q"]=14,["R"]=15,["S"]=16,
    ["T"]=17,["V"]=18,["W"]=19,["Y"]=20
}

--Propy's SW Order matrix
--Well, propy like this, then let's do this, this table was converted from the python codes of propy using the following lua piece
--[[
	x = '"GW":0.923, "GV":0.464, "GT":0.272, "GS":0.158, "GR":1.0, "GQ":0.467, "GP":0.323, "GY":0.728, "GG":0.0, "GF":0.727, "GE":0.807, "GD":0.776, "GC":0.312, "GA":0.206, "GN":0.381, "GM":0.557, "GL":0.591, "GK":0.894, "GI":0.592, "GH":0.769, "ME":0.879, "MD":0.932, "MG":0.569, "MF":0.182, "MA":0.383, "MC":0.276, "MM":0.0, "ML":0.062, "MN":0.447, "MI":0.058, "MH":0.648, "MK":0.884, "MT":0.358, "MW":0.391, "MV":0.12, "MQ":0.372, "MP":0.285, "MS":0.417, "MR":1.0, "MY":0.255, "FP":0.42, "FQ":0.459, "FR":1.0, "FS":0.548, "FT":0.499, "FV":0.252, "FW":0.207, "FY":0.179, "FA":0.508, "FC":0.405, "FD":0.977, "FE":0.918, "FF":0.0, "FG":0.69, "FH":0.663, "FI":0.128, "FK":0.903, "FL":0.131, "FM":0.169, "FN":0.541, "SY":0.615, "SS":0.0, "SR":1.0, "SQ":0.358, "SP":0.181, "SW":0.827, "SV":0.342, "ST":0.174, "SK":0.883, "SI":0.478, "SH":0.718, "SN":0.289, "SM":0.44, "SL":0.474, "SC":0.185, "SA":0.1, "SG":0.17, "SF":0.622, "SE":0.812, "SD":0.801, "YI":0.23, "YH":0.678, "YK":0.904, "YM":0.268, "YL":0.219, "YN":0.512, "YA":0.587, "YC":0.478, "YE":0.932, "YD":1.0, "YG":0.782, "YF":0.202, "YY":0.0, "YQ":0.404, "YP":0.444, "YS":0.612, "YR":0.995, "YT":0.557, "YW":0.244, "YV":0.328, "LF":0.139, "LG":0.596, "LD":0.944, "LE":0.892, "LC":0.296, "LA":0.405, "LN":0.452, "LL":0.0, "LM":0.062, "LK":0.893, "LH":0.653, "LI":0.013, "LV":0.133, "LW":0.341, "LT":0.397, "LR":1.0, "LS":0.443, "LP":0.309, "LQ":0.376, "LY":0.205, "RT":0.808, "RV":0.914, "RW":1.0, "RP":0.796, "RQ":0.668, "RR":0.0, "RS":0.86, "RY":0.859, "RD":0.305, "RE":0.225, "RF":0.977, "RG":0.928, "RA":0.919, "RC":0.905, "RL":0.92, "RM":0.908, "RN":0.69, "RH":0.498, "RI":0.929, "RK":0.141, "VH":0.649, "VI":0.135, "EM":0.83, "EL":0.854, "EN":0.599, "EI":0.86, "EH":0.406, "EK":0.143, "EE":0.0, "ED":0.133, "EG":0.779, "EF":0.932, "EA":0.79, "EC":0.788, "VM":0.12, "EY":0.837, "VN":0.38, "ET":0.682, "EW":1.0, "EV":0.824, "EQ":0.598, "EP":0.688, "ES":0.726, "ER":0.234, "VP":0.212, "VQ":0.339, "VR":1.0, "VT":0.305, "VW":0.472, "KC":0.871, "KA":0.889, "KG":0.9, "KF":0.957, "KE":0.149, "KD":0.279, "KK":0.0, "KI":0.899, "KH":0.438, "KN":0.667, "KM":0.871, "KL":0.892, "KS":0.825, "KR":0.154, "KQ":0.639, "KP":0.757, "KW":1.0, "KV":0.882, "KT":0.759, "KY":0.848, "DN":0.56, "DL":0.841, "DM":0.819, "DK":0.249, "DH":0.435, "DI":0.847, "DF":0.924, "DG":0.697, "DD":0.0, "DE":0.124, "DC":0.742, "DA":0.729, "DY":0.836, "DV":0.797, "DW":1.0, "DT":0.649, "DR":0.295, "DS":0.667, "DP":0.657, "DQ":0.584, "QQ":0.0, "QP":0.272, "QS":0.461, "QR":1.0, "QT":0.389, "QW":0.831, "QV":0.464, "QY":0.522, "QA":0.512, "QC":0.462, "QE":0.861, "QD":0.903, "QG":0.648, "QF":0.671, "QI":0.532, "QH":0.765, "QK":0.881, "QM":0.505, "QL":0.518, "QN":0.181, "WG":0.829, "WF":0.196, "WE":0.931, "WD":1.0, "WC":0.56, "WA":0.658, "WN":0.631, "WM":0.344, "WL":0.304, "WK":0.892, "WI":0.305, "WH":0.678, "WW":0.0, "WV":0.418, "WT":0.638, "WS":0.689, "WR":0.968, "WQ":0.538, "WP":0.555, "WY":0.204, "PR":1.0, "PS":0.196, "PP":0.0, "PQ":0.228, "PV":0.244, "PW":0.72, "PT":0.161, "PY":0.481, "PC":0.179, "PA":0.22, "PF":0.515, "PG":0.376, "PD":0.852, "PE":0.831, "PK":0.875, "PH":0.696, "PI":0.363, "PN":0.231, "PL":0.357, "PM":0.326, "CK":0.887, "CI":0.304, "CH":0.66, "CN":0.324, "CM":0.277, "CL":0.301, "CC":0.0, "CA":0.114, "CG":0.32, "CF":0.437, "CE":0.838, "CD":0.847, "CY":0.457, "CS":0.176, "CR":1.0, "CQ":0.341, "CP":0.157, "CW":0.639, "CV":0.167, "CT":0.233, "IY":0.213, "VA":0.275, "VC":0.165, "VD":0.9, "VE":0.867, "VF":0.269, "VG":0.471, "IQ":0.383, "IP":0.311, "IS":0.443, "IR":1.0, "VL":0.134, "IT":0.396, "IW":0.339, "IV":0.133, "II":0.0, "IH":0.652, "IK":0.892, "VS":0.322, "IM":0.057, "IL":0.013, "VV":0.0, "IN":0.457, "IA":0.403, "VY":0.31, "IC":0.296, "IE":0.891, "ID":0.942, "IG":0.592, "IF":0.134, "HY":0.821, "HR":0.697, "HS":0.865, "HP":0.777, "HQ":0.716, "HV":0.831, "HW":0.981, "HT":0.834, "HK":0.566, "HH":0.0, "HI":0.848, "HN":0.754, "HL":0.842, "HM":0.825, "HC":0.836, "HA":0.896, "HF":0.907, "HG":1.0, "HD":0.629, "HE":0.547, "NH":0.78, "NI":0.615, "NK":0.891, "NL":0.603, "NM":0.588, "NN":0.0, "NA":0.424, "NC":0.425, "ND":0.838, "NE":0.835, "NF":0.766, "NG":0.512, "NY":0.641, "NP":0.266, "NQ":0.175, "NR":1.0, "NS":0.361, "NT":0.368, "NV":0.503, "NW":0.945, "TY":0.596, "TV":0.345, "TW":0.816, "TT":0.0, "TR":1.0, "TS":0.185, "TP":0.159, "TQ":0.322, "TN":0.315, "TL":0.453, "TM":0.403, "TK":0.866, "TH":0.737, "TI":0.455, "TF":0.604, "TG":0.312, "TD":0.83, "TE":0.812, "TC":0.261, "TA":0.251, "AA":0.0, "AC":0.112, "AE":0.827, "AD":0.819, "AG":0.208, "AF":0.54, "AI":0.407, "AH":0.696, "AK":0.891, "AM":0.379, "AL":0.406, "AN":0.318, "AQ":0.372, "AP":0.191, "AS":0.094, "AR":1.0, "AT":0.22, "AW":0.739, "AV":0.273, "AY":0.552, "VK":0.889'
	for k,v in x:gmatch("(\"%a+\"):([+-]?%d+%.%d+)") do
		io.write ("["..k.."]="..v..",")
	end
--]]
SWOrder = {["GW"]=0.923,["GV"]=0.464,["GT"]=0.272,["GS"]=0.158,["GR"]=1.0,["GQ"]=0.467,["GP"]=0.323,["GY"]=0.728,["GG"]=0.0,["GF"]=0.727,["GE"]=0.807,["GD"]=0.776,["GC"]=0.312,["GA"]=0.206,["GN"]=0.381,["GM"]=0.557,["GL"]=0.591,["GK"]=0.894,["GI"]=0.592,["GH"]=0.769,["ME"]=0.879,["MD"]=0.932,["MG"]=0.569,["MF"]=0.182,["MA"]=0.383,["MC"]=0.276,["MM"]=0.0,["ML"]=0.062,["MN"]=0.447,["MI"]=0.058,["MH"]=0.648,["MK"]=0.884,["MT"]=0.358,["MW"]=0.391,["MV"]=0.12,["MQ"]=0.372,["MP"]=0.285,["MS"]=0.417,["MR"]=1.0,["MY"]=0.255,["FP"]=0.42,["FQ"]=0.459,["FR"]=1.0,["FS"]=0.548,["FT"]=0.499,["FV"]=0.252,["FW"]=0.207,["FY"]=0.179,["FA"]=0.508,["FC"]=0.405,["FD"]=0.977,["FE"]=0.918,["FF"]=0.0,["FG"]=0.69,["FH"]=0.663,["FI"]=0.128,["FK"]=0.903,["FL"]=0.131,["FM"]=0.169,["FN"]=0.541,["SY"]=0.615,["SS"]=0.0,["SR"]=1.0,["SQ"]=0.358,["SP"]=0.181,["SW"]=0.827,["SV"]=0.342,["ST"]=0.174,["SK"]=0.883,["SI"]=0.478,["SH"]=0.718,["SN"]=0.289,["SM"]=0.44,["SL"]=0.474,["SC"]=0.185,["SA"]=0.1,["SG"]=0.17,["SF"]=0.622,["SE"]=0.812,["SD"]=0.801,["YI"]=0.23,["YH"]=0.678,["YK"]=0.904,["YM"]=0.268,["YL"]=0.219,["YN"]=0.512,["YA"]=0.587,["YC"]=0.478,["YE"]=0.932,["YD"]=1.0,["YG"]=0.782,["YF"]=0.202,["YY"]=0.0,["YQ"]=0.404,["YP"]=0.444,["YS"]=0.612,["YR"]=0.995,["YT"]=0.557,["YW"]=0.244,["YV"]=0.328,["LF"]=0.139,["LG"]=0.596,["LD"]=0.944,["LE"]=0.892,["LC"]=0.296,["LA"]=0.405,["LN"]=0.452,["LL"]=0.0,["LM"]=0.062,["LK"]=0.893,["LH"]=0.653,["LI"]=0.013,["LV"]=0.133,["LW"]=0.341,["LT"]=0.397,["LR"]=1.0,["LS"]=0.443,["LP"]=0.309,["LQ"]=0.376,["LY"]=0.205,["RT"]=0.808,["RV"]=0.914,["RW"]=1.0,["RP"]=0.796,["RQ"]=0.668,["RR"]=0.0,["RS"]=0.86,["RY"]=0.859,["RD"]=0.305,["RE"]=0.225,["RF"]=0.977,["RG"]=0.928,["RA"]=0.919,["RC"]=0.905,["RL"]=0.92,["RM"]=0.908,["RN"]=0.69,["RH"]=0.498,["RI"]=0.929,["RK"]=0.141,["VH"]=0.649,["VI"]=0.135,["EM"]=0.83,["EL"]=0.854,["EN"]=0.599,["EI"]=0.86,["EH"]=0.406,["EK"]=0.143,["EE"]=0.0,["ED"]=0.133,["EG"]=0.779,["EF"]=0.932,["EA"]=0.79,["EC"]=0.788,["VM"]=0.12,["EY"]=0.837,["VN"]=0.38,["ET"]=0.682,["EW"]=1.0,["EV"]=0.824,["EQ"]=0.598,["EP"]=0.688,["ES"]=0.726,["ER"]=0.234,["VP"]=0.212,["VQ"]=0.339,["VR"]=1.0,["VT"]=0.305,["VW"]=0.472,["KC"]=0.871,["KA"]=0.889,["KG"]=0.9,["KF"]=0.957,["KE"]=0.149,["KD"]=0.279,["KK"]=0.0,["KI"]=0.899,["KH"]=0.438,["KN"]=0.667,["KM"]=0.871,["KL"]=0.892,["KS"]=0.825,["KR"]=0.154,["KQ"]=0.639,["KP"]=0.757,["KW"]=1.0,["KV"]=0.882,["KT"]=0.759,["KY"]=0.848,["DN"]=0.56,["DL"]=0.841,["DM"]=0.819,["DK"]=0.249,["DH"]=0.435,["DI"]=0.847,["DF"]=0.924,["DG"]=0.697,["DD"]=0.0,["DE"]=0.124,["DC"]=0.742,["DA"]=0.729,["DY"]=0.836,["DV"]=0.797,["DW"]=1.0,["DT"]=0.649,["DR"]=0.295,["DS"]=0.667,["DP"]=0.657,["DQ"]=0.584,["QQ"]=0.0,["QP"]=0.272,["QS"]=0.461,["QR"]=1.0,["QT"]=0.389,["QW"]=0.831,["QV"]=0.464,["QY"]=0.522,["QA"]=0.512,["QC"]=0.462,["QE"]=0.861,["QD"]=0.903,["QG"]=0.648,["QF"]=0.671,["QI"]=0.532,["QH"]=0.765,["QK"]=0.881,["QM"]=0.505,["QL"]=0.518,["QN"]=0.181,["WG"]=0.829,["WF"]=0.196,["WE"]=0.931,["WD"]=1.0,["WC"]=0.56,["WA"]=0.658,["WN"]=0.631,["WM"]=0.344,["WL"]=0.304,["WK"]=0.892,["WI"]=0.305,["WH"]=0.678,["WW"]=0.0,["WV"]=0.418,["WT"]=0.638,["WS"]=0.689,["WR"]=0.968,["WQ"]=0.538,["WP"]=0.555,["WY"]=0.204,["PR"]=1.0,["PS"]=0.196,["PP"]=0.0,["PQ"]=0.228,["PV"]=0.244,["PW"]=0.72,["PT"]=0.161,["PY"]=0.481,["PC"]=0.179,["PA"]=0.22,["PF"]=0.515,["PG"]=0.376,["PD"]=0.852,["PE"]=0.831,["PK"]=0.875,["PH"]=0.696,["PI"]=0.363,["PN"]=0.231,["PL"]=0.357,["PM"]=0.326,["CK"]=0.887,["CI"]=0.304,["CH"]=0.66,["CN"]=0.324,["CM"]=0.277,["CL"]=0.301,["CC"]=0.0,["CA"]=0.114,["CG"]=0.32,["CF"]=0.437,["CE"]=0.838,["CD"]=0.847,["CY"]=0.457,["CS"]=0.176,["CR"]=1.0,["CQ"]=0.341,["CP"]=0.157,["CW"]=0.639,["CV"]=0.167,["CT"]=0.233,["IY"]=0.213,["VA"]=0.275,["VC"]=0.165,["VD"]=0.9,["VE"]=0.867,["VF"]=0.269,["VG"]=0.471,["IQ"]=0.383,["IP"]=0.311,["IS"]=0.443,["IR"]=1.0,["VL"]=0.134,["IT"]=0.396,["IW"]=0.339,["IV"]=0.133,["II"]=0.0,["IH"]=0.652,["IK"]=0.892,["VS"]=0.322,["IM"]=0.057,["IL"]=0.013,["VV"]=0.0,["IN"]=0.457,["IA"]=0.403,["VY"]=0.31,["IC"]=0.296,["IE"]=0.891,["ID"]=0.942,["IG"]=0.592,["IF"]=0.134,["HY"]=0.821,["HR"]=0.697,["HS"]=0.865,["HP"]=0.777,["HQ"]=0.716,["HV"]=0.831,["HW"]=0.981,["HT"]=0.834,["HK"]=0.566,["HH"]=0.0,["HI"]=0.848,["HN"]=0.754,["HL"]=0.842,["HM"]=0.825,["HC"]=0.836,["HA"]=0.896,["HF"]=0.907,["HG"]=1.0,["HD"]=0.629,["HE"]=0.547,["NH"]=0.78,["NI"]=0.615,["NK"]=0.891,["NL"]=0.603,["NM"]=0.588,["NN"]=0.0,["NA"]=0.424,["NC"]=0.425,["ND"]=0.838,["NE"]=0.835,["NF"]=0.766,["NG"]=0.512,["NY"]=0.641,["NP"]=0.266,["NQ"]=0.175,["NR"]=1.0,["NS"]=0.361,["NT"]=0.368,["NV"]=0.503,["NW"]=0.945,["TY"]=0.596,["TV"]=0.345,["TW"]=0.816,["TT"]=0.0,["TR"]=1.0,["TS"]=0.185,["TP"]=0.159,["TQ"]=0.322,["TN"]=0.315,["TL"]=0.453,["TM"]=0.403,["TK"]=0.866,["TH"]=0.737,["TI"]=0.455,["TF"]=0.604,["TG"]=0.312,["TD"]=0.83,["TE"]=0.812,["TC"]=0.261,["TA"]=0.251,["AA"]=0.0,["AC"]=0.112,["AE"]=0.827,["AD"]=0.819,["AG"]=0.208,["AF"]=0.54,["AI"]=0.407,["AH"]=0.696,["AK"]=0.891,["AM"]=0.379,["AL"]=0.406,["AN"]=0.318,["AQ"]=0.372,["AP"]=0.191,["AS"]=0.094,["AR"]=1.0,["AT"]=0.22,["AW"]=0.739,["AV"]=0.273,["AY"]=0.552,["VK"]=0.889}

--Propy's Grant Order matrix
--Well, propy like this, then let's do this again
OldGrantOrder = {["GW"]=0.923,["GV"]=0.464,["GT"]=0.272,["GS"]=0.158,["GR"]=1.0,["GQ"]=0.467,["GP"]=0.323,["GY"]=0.728,["GG"]=0.0,["GF"]=0.727,["GE"]=0.807,["GD"]=0.776,["GC"]=0.312,["GA"]=0.206,["GN"]=0.381,["GM"]=0.557,["GL"]=0.591,["GK"]=0.894,["GI"]=0.592,["GH"]=0.769,["ME"]=0.879,["MD"]=0.932,["MG"]=0.569,["MF"]=0.182,["MA"]=0.383,["MC"]=0.276,["MM"]=0.0,["ML"]=0.062,["MN"]=0.447,["MI"]=0.058,["MH"]=0.648,["MK"]=0.884,["MT"]=0.358,["MW"]=0.391,["MV"]=0.12,["MQ"]=0.372,["MP"]=0.285,["MS"]=0.417,["MR"]=1.0,["MY"]=0.255,["FP"]=0.42,["FQ"]=0.459,["FR"]=1.0,["FS"]=0.548,["FT"]=0.499,["FV"]=0.252,["FW"]=0.207,["FY"]=0.179,["FA"]=0.508,["FC"]=0.405,["FD"]=0.977,["FE"]=0.918,["FF"]=0.0,["FG"]=0.69,["FH"]=0.663,["FI"]=0.128,["FK"]=0.903,["FL"]=0.131,["FM"]=0.169,["FN"]=0.541,["SY"]=0.615,["SS"]=0.0,["SR"]=1.0,["SQ"]=0.358,["SP"]=0.181,["SW"]=0.827,["SV"]=0.342,["ST"]=0.174,["SK"]=0.883,["SI"]=0.478,["SH"]=0.718,["SN"]=0.289,["SM"]=0.44,["SL"]=0.474,["SC"]=0.185,["SA"]=0.1,["SG"]=0.17,["SF"]=0.622,["SE"]=0.812,["SD"]=0.801,["YI"]=0.23,["YH"]=0.678,["YK"]=0.904,["YM"]=0.268,["YL"]=0.219,["YN"]=0.512,["YA"]=0.587,["YC"]=0.478,["YE"]=0.932,["YD"]=1.0,["YG"]=0.782,["YF"]=0.202,["YY"]=0.0,["YQ"]=0.404,["YP"]=0.444,["YS"]=0.612,["YR"]=0.995,["YT"]=0.557,["YW"]=0.244,["YV"]=0.328,["LF"]=0.139,["LG"]=0.596,["LD"]=0.944,["LE"]=0.892,["LC"]=0.296,["LA"]=0.405,["LN"]=0.452,["LL"]=0.0,["LM"]=0.062,["LK"]=0.893,["LH"]=0.653,["LI"]=0.013,["LV"]=0.133,["LW"]=0.341,["LT"]=0.397,["LR"]=1.0,["LS"]=0.443,["LP"]=0.309,["LQ"]=0.376,["LY"]=0.205,["RT"]=0.808,["RV"]=0.914,["RW"]=1.0,["RP"]=0.796,["RQ"]=0.668,["RR"]=0.0,["RS"]=0.86,["RY"]=0.859,["RD"]=0.305,["RE"]=0.225,["RF"]=0.977,["RG"]=0.928,["RA"]=0.919,["RC"]=0.905,["RL"]=0.92,["RM"]=0.908,["RN"]=0.69,["RH"]=0.498,["RI"]=0.929,["RK"]=0.141,["VH"]=0.649,["VI"]=0.135,["EM"]=0.83,["EL"]=0.854,["EN"]=0.599,["EI"]=0.86,["EH"]=0.406,["EK"]=0.143,["EE"]=0.0,["ED"]=0.133,["EG"]=0.779,["EF"]=0.932,["EA"]=0.79,["EC"]=0.788,["VM"]=0.12,["EY"]=0.837,["VN"]=0.38,["ET"]=0.682,["EW"]=1.0,["EV"]=0.824,["EQ"]=0.598,["EP"]=0.688,["ES"]=0.726,["ER"]=0.234,["VP"]=0.212,["VQ"]=0.339,["VR"]=1.0,["VT"]=0.305,["VW"]=0.472,["KC"]=0.871,["KA"]=0.889,["KG"]=0.9,["KF"]=0.957,["KE"]=0.149,["KD"]=0.279,["KK"]=0.0,["KI"]=0.899,["KH"]=0.438,["KN"]=0.667,["KM"]=0.871,["KL"]=0.892,["KS"]=0.825,["KR"]=0.154,["KQ"]=0.639,["KP"]=0.757,["KW"]=1.0,["KV"]=0.882,["KT"]=0.759,["KY"]=0.848,["DN"]=0.56,["DL"]=0.841,["DM"]=0.819,["DK"]=0.249,["DH"]=0.435,["DI"]=0.847,["DF"]=0.924,["DG"]=0.697,["DD"]=0.0,["DE"]=0.124,["DC"]=0.742,["DA"]=0.729,["DY"]=0.836,["DV"]=0.797,["DW"]=1.0,["DT"]=0.649,["DR"]=0.295,["DS"]=0.667,["DP"]=0.657,["DQ"]=0.584,["QQ"]=0.0,["QP"]=0.272,["QS"]=0.461,["QR"]=1.0,["QT"]=0.389,["QW"]=0.831,["QV"]=0.464,["QY"]=0.522,["QA"]=0.512,["QC"]=0.462,["QE"]=0.861,["QD"]=0.903,["QG"]=0.648,["QF"]=0.671,["QI"]=0.532,["QH"]=0.765,["QK"]=0.881,["QM"]=0.505,["QL"]=0.518,["QN"]=0.181,["WG"]=0.829,["WF"]=0.196,["WE"]=0.931,["WD"]=1.0,["WC"]=0.56,["WA"]=0.658,["WN"]=0.631,["WM"]=0.344,["WL"]=0.304,["WK"]=0.892,["WI"]=0.305,["WH"]=0.678,["WW"]=0.0,["WV"]=0.418,["WT"]=0.638,["WS"]=0.689,["WR"]=0.968,["WQ"]=0.538,["WP"]=0.555,["WY"]=0.204,["PR"]=1.0,["PS"]=0.196,["PP"]=0.0,["PQ"]=0.228,["PV"]=0.244,["PW"]=0.72,["PT"]=0.161,["PY"]=0.481,["PC"]=0.179,["PA"]=0.22,["PF"]=0.515,["PG"]=0.376,["PD"]=0.852,["PE"]=0.831,["PK"]=0.875,["PH"]=0.696,["PI"]=0.363,["PN"]=0.231,["PL"]=0.357,["PM"]=0.326,["CK"]=0.887,["CI"]=0.304,["CH"]=0.66,["CN"]=0.324,["CM"]=0.277,["CL"]=0.301,["CC"]=0.0,["CA"]=0.114,["CG"]=0.32,["CF"]=0.437,["CE"]=0.838,["CD"]=0.847,["CY"]=0.457,["CS"]=0.176,["CR"]=1.0,["CQ"]=0.341,["CP"]=0.157,["CW"]=0.639,["CV"]=0.167,["CT"]=0.233,["IY"]=0.213,["VA"]=0.275,["VC"]=0.165,["VD"]=0.9,["VE"]=0.867,["VF"]=0.269,["VG"]=0.471,["IQ"]=0.383,["IP"]=0.311,["IS"]=0.443,["IR"]=1.0,["VL"]=0.134,["IT"]=0.396,["IW"]=0.339,["IV"]=0.133,["II"]=0.0,["IH"]=0.652,["IK"]=0.892,["VS"]=0.322,["IM"]=0.057,["IL"]=0.013,["VV"]=0.0,["IN"]=0.457,["IA"]=0.403,["VY"]=0.31,["IC"]=0.296,["IE"]=0.891,["ID"]=0.942,["IG"]=0.592,["IF"]=0.134,["HY"]=0.821,["HR"]=0.697,["HS"]=0.865,["HP"]=0.777,["HQ"]=0.716,["HV"]=0.831,["HW"]=0.981,["HT"]=0.834,["HK"]=0.566,["HH"]=0.0,["HI"]=0.848,["HN"]=0.754,["HL"]=0.842,["HM"]=0.825,["HC"]=0.836,["HA"]=0.896,["HF"]=0.907,["HG"]=1.0,["HD"]=0.629,["HE"]=0.547,["NH"]=0.78,["NI"]=0.615,["NK"]=0.891,["NL"]=0.603,["NM"]=0.588,["NN"]=0.0,["NA"]=0.424,["NC"]=0.425,["ND"]=0.838,["NE"]=0.835,["NF"]=0.766,["NG"]=0.512,["NY"]=0.641,["NP"]=0.266,["NQ"]=0.175,["NR"]=1.0,["NS"]=0.361,["NT"]=0.368,["NV"]=0.503,["NW"]=0.945,["TY"]=0.596,["TV"]=0.345,["TW"]=0.816,["TT"]=0.0,["TR"]=1.0,["TS"]=0.185,["TP"]=0.159,["TQ"]=0.322,["TN"]=0.315,["TL"]=0.453,["TM"]=0.403,["TK"]=0.866,["TH"]=0.737,["TI"]=0.455,["TF"]=0.604,["TG"]=0.312,["TD"]=0.83,["TE"]=0.812,["TC"]=0.261,["TA"]=0.251,["AA"]=0.0,["AC"]=0.112,["AE"]=0.827,["AD"]=0.819,["AG"]=0.208,["AF"]=0.54,["AI"]=0.407,["AH"]=0.696,["AK"]=0.891,["AM"]=0.379,["AL"]=0.406,["AN"]=0.318,["AQ"]=0.372,["AP"]=0.191,["AS"]=0.094,["AR"]=1.0,["AT"]=0.22,["AW"]=0.739,["AV"]=0.273,["AY"]=0.552,["VK"]=0.889}

--However, this should no be the same as SWOrder, let us just see how long does propy need to realize this error
--Here are the Grant Order values provided in the suppl of propy publication
--For converting this, we only need a VBA subroutine plug-into propy suppl xls file like the following
--[[
	'Hi, propy, I am collecting your data, which you won't use.
	Sub HiPropy()
		Dim D As String
		D = ""
		For i = 2 To 21
			For j = 2 To 21
				D = D + Sheet2.Cells(i, 1).Text + Sheet2.Cells(j, 1).Text + "=" + Sheet2.Cells(i, j).Text + ","
			Next j
		Next i
		Debug.Print D
	End Sub
--]]
--Obtaining the above output and use the following command to generate the following table. Yeap, this is a little lazy command
--[[
	cat propygrant.log | tr "," "\n" | sed -e 's/^/["/g' -e 's/=/"]=/g' | tr "\n" ","
--]]
GrantOrder = {["AA"]=0,["AR"]=112,["AN"]=111,["AD"]=126,["AC"]=195,["AQ"]=91,["AE"]=107,["AG"]=60,["AH"]=86,["AI"]=94,["AL"]=96,["AK"]=106,["AM"]=84,["AF"]=113,["AP"]=27,["AS"]=99,["AT"]=58,["AW"]=148,["AY"]=112,["AV"]=64,["RA"]=112,["RR"]=0,["RN"]=86,["RD"]=96,["RC"]=180,["RQ"]=43,["RE"]=54,["RG"]=125,["RH"]=29,["RI"]=97,["RL"]=102,["RK"]=26,["RM"]=91,["RF"]=97,["RP"]=103,["RS"]=110,["RT"]=71,["RW"]=101,["RY"]=77,["RV"]=96,["NA"]=111,["NR"]=86,["NN"]=0,["ND"]=23,["NC"]=139,["NQ"]=46,["NE"]=42,["NG"]=80,["NH"]=68,["NI"]=149,["NL"]=153,["NK"]=94,["NM"]=142,["NF"]=158,["NP"]=91,["NS"]=46,["NT"]=65,["NW"]=174,["NY"]=143,["NV"]=133,["DA"]=126,["DR"]=96,["DN"]=23,["DD"]=0,["DC"]=154,["DQ"]=61,["DE"]=45,["DG"]=94,["DH"]=81,["DI"]=168,["DL"]=172,["DK"]=101,["DM"]=160,["DF"]=177,["DP"]=108,["DS"]=65,["DT"]=85,["DW"]=181,["DY"]=160,["DV"]=152,["CA"]=195,["CR"]=180,["CN"]=139,["CD"]=154,["CC"]=0,["CQ"]=154,["CE"]=170,["CG"]=159,["CH"]=174,["CI"]=198,["CL"]=198,["CK"]=202,["CM"]=196,["CF"]=205,["CP"]=169,["CS"]=112,["CT"]=149,["CW"]=215,["CY"]=194,["CV"]=192,["QA"]=91,["QR"]=43,["QN"]=46,["QD"]=61,["QC"]=154,["QQ"]=0,["QE"]=29,["QG"]=87,["QH"]=24,["QI"]=109,["QL"]=113,["QK"]=53,["QM"]=101,["QF"]=116,["QP"]=76,["QS"]=68,["QT"]=42,["QW"]=130,["QY"]=99,["QV"]=96,["EA"]=107,["ER"]=54,["EN"]=42,["ED"]=45,["EC"]=170,["EQ"]=29,["EE"]=0,["EG"]=98,["EH"]=40,["EI"]=134,["EL"]=138,["EK"]=56,["EM"]=126,["EF"]=140,["EP"]=93,["ES"]=80,["ET"]=65,["EW"]=152,["EY"]=122,["EV"]=121,["GA"]=60,["GR"]=125,["GN"]=80,["GD"]=94,["GC"]=159,["GQ"]=87,["GE"]=98,["GG"]=0,["GH"]=98,["GI"]=135,["GL"]=138,["GK"]=127,["GM"]=127,["GF"]=153,["GP"]=42,["GS"]=56,["GT"]=59,["GW"]=184,["GY"]=147,["GV"]=109,["HA"]=86,["HR"]=29,["HN"]=68,["HD"]=81,["HC"]=174,["HQ"]=24,["HE"]=40,["HG"]=98,["HH"]=0,["HI"]=94,["HL"]=99,["HK"]=32,["HM"]=87,["HF"]=100,["HP"]=77,["HS"]=89,["HT"]=47,["HW"]=115,["HY"]=83,["HV"]=84,["IA"]=94,["IR"]=97,["IN"]=149,["ID"]=168,["IC"]=198,["IQ"]=109,["IE"]=134,["IG"]=135,["IH"]=94,["II"]=0,["IL"]=5,["IK"]=102,["IM"]=10,["IF"]=21,["IP"]=95,["IS"]=142,["IT"]=89,["IW"]=61,["IY"]=33,["IV"]=29,["LA"]=96,["LR"]=102,["LN"]=153,["LD"]=172,["LC"]=198,["LQ"]=113,["LE"]=138,["LG"]=138,["LH"]=99,["LI"]=5,["LL"]=0,["LK"]=107,["LM"]=15,["LF"]=22,["LP"]=98,["LS"]=145,["LT"]=92,["LW"]=61,["LY"]=36,["LV"]=32,["KA"]=106,["KR"]=26,["KN"]=94,["KD"]=101,["KC"]=202,["KQ"]=53,["KE"]=56,["KG"]=127,["KH"]=32,["KI"]=102,["KL"]=107,["KK"]=0,["KM"]=95,["KF"]=102,["KP"]=103,["KS"]=121,["KT"]=78,["KW"]=110,["KY"]=85,["KV"]=97,["MA"]=84,["MR"]=91,["MN"]=142,["MD"]=160,["MC"]=196,["MQ"]=101,["ME"]=126,["MG"]=127,["MH"]=87,["MI"]=10,["ML"]=15,["MK"]=95,["MM"]=0,["MF"]=28,["MP"]=87,["MS"]=135,["MT"]=81,["MW"]=67,["MY"]=36,["MV"]=21,["FA"]=113,["FR"]=97,["FN"]=158,["FD"]=177,["FC"]=205,["FQ"]=116,["FE"]=140,["FG"]=153,["FH"]=100,["FI"]=21,["FL"]=22,["FK"]=102,["FM"]=28,["FF"]=0,["FP"]=114,["FS"]=155,["FT"]=103,["FW"]=40,["FY"]=22,["FV"]=50,["PA"]=27,["PR"]=103,["PN"]=91,["PD"]=108,["PC"]=169,["PQ"]=76,["PE"]=93,["PG"]=42,["PH"]=77,["PI"]=95,["PL"]=98,["PK"]=103,["PM"]=87,["PF"]=114,["PP"]=0,["PS"]=74,["PT"]=38,["PW"]=147,["PY"]=110,["PV"]=68,["SA"]=99,["SR"]=110,["SN"]=46,["SD"]=65,["SC"]=112,["SQ"]=68,["SE"]=80,["SG"]=56,["SH"]=89,["SI"]=142,["SL"]=145,["SK"]=121,["SM"]=135,["SF"]=155,["SP"]=74,["SS"]=0,["ST"]=58,["SW"]=177,["SY"]=144,["SV"]=124,["TA"]=58,["TR"]=71,["TN"]=65,["TD"]=85,["TC"]=149,["TQ"]=42,["TE"]=65,["TG"]=59,["TH"]=47,["TI"]=89,["TL"]=92,["TK"]=78,["TM"]=81,["TF"]=103,["TP"]=38,["TS"]=58,["TT"]=0,["TW"]=128,["TY"]=92,["TV"]=69,["WA"]=148,["WR"]=101,["WN"]=174,["WD"]=181,["WC"]=215,["WQ"]=130,["WE"]=152,["WG"]=184,["WH"]=115,["WI"]=61,["WL"]=61,["WK"]=110,["WM"]=67,["WF"]=40,["WP"]=147,["WS"]=177,["WT"]=128,["WW"]=0,["WY"]=37,["WV"]=88,["YA"]=112,["YR"]=77,["YN"]=143,["YD"]=160,["YC"]=194,["YQ"]=99,["YE"]=122,["YG"]=147,["YH"]=83,["YI"]=33,["YL"]=36,["YK"]=85,["YM"]=36,["YF"]=22,["YP"]=110,["YS"]=144,["YT"]=92,["YW"]=37,["YY"]=0,["YV"]=55,["VA"]=64,["VR"]=96,["VN"]=133,["VD"]=152,["VC"]=192,["VQ"]=96,["VE"]=121,["VG"]=109,["VH"]=84,["VI"]=29,["VL"]=32,["VK"]=97,["VM"]=21,["VF"]=50,["VP"]=68,["VS"]=124,["VT"]=69,["VW"]=88,["VY"]=55,["VV"]=0}

ordersList = 
{
	["SWOrder"] = SWOrder,
	["GrantOrder"] = GrantOrder,
	["GrantOrderLikePropy"] = OldGrantOrder
}
--Propy's CTD Database, only 1,2,3, Oh, yeah~. Lets convert them from python
--'1'stand for Polar; '2'stand for Neutral, '3' stand for Hydrophobicity
Hydrophobicity=
{
    [1]="RKEDQN",
    [2]="GASTPHY",
    [3]="CLVIMFW"
}

--'1'stand for (0-2.78); '2'stand for (2.95-4.0), '3' stand for (4.03-8.08)
NormalizedVDWV=
{
    [1]="GASTPD",
    [2]="NVEQIL",
    [3]="MHKFRYW"
}

--'1'stand for (4.9-6.2); '2'stand for (8.0-9.2), '3' stand for (10.4-13.0)
Polarity=
{
    [1]="LIFWCMVY",
    [2]="CPNVEQIL",
    [3]="KMHFRYW"
}

--'1'stand for (4.9-6.2); '2'stand for (8.0-9.2), '3' stand for (10.4-13.0)
Charge=
{
    [1]="KR",
    [2]="ANCQGHILMFPSTWYV",
    [3]="DE"
}

--#'1'stand for Helix; '2'stand for Strand, '3' stand for coil
SecondaryStr=
{
    [1]="EALMQKRH",
    [2]="VIYCWFT",
    [3]="GNPSD"
}

--#'1'stand for Buried; '2'stand for Exposed, '3' stand for Intermediate
SolventAccessibility=
{
    [1]="ALFCGIVW",
    [2]="RKQEND",
    [3]="MPSTHY"
}

--#'1'stand for (0-0.108); '2'stand for (0.128-0.186), '3' stand for (0.219-0.409)
Polarizability=
{
    [1]="GASDT",
    [2]="CPNVEQIL",
    [3]="KMHFRYW"
}

propList =
{
    ["Hydrophobicity"] = Hydrophobicity,
    ["Polarizability"] = Polarizability,
    ["SolventAccessibility"] = SolventAccessibility,
    ["SecondaryStr"] = SecondaryStr,
    ["Charge"] = Charge,
    ["Polarity"] = Polarity,
    ["NormalizedVDWV"] = NormalizedVDWV
}
--Propy's CTD database ends here

--A global variable buffer to avoid crossing C/Lua boundary every time the script is called
tempPC = {}
pseb_opt = nil
pseb_opt_w = nil
pseb_opt_l = nil

AddModule("PSEB3")
SetNotation("STDPROT")

--UltraPse additional interface
function pseb3_length()
    if not pseb_opt then
		pseb_opt = psebGetOptions()
		if pseb_opt then
			pseb_opt_l = pseb_opt["l"]
			pseb_opt_w = pseb_opt["w"]
		end
	end
	return 20 + pseb_opt_l
end

--C/Lua interface
function pseb3_seq_proc (pr_id, pr_seq)
	--Of cause, you need to modify here in order to use different functions. This is exactly what u need to do with propy.
	local propy_quasi = propyQuasiSequanceOrder(pr_seq, "SWOrder", pseb_opt_l, pseb_opt_w)
    return 20+pseb_opt_l,propy_quasi
end

--Well, this function has been implemented natively in pseb since version 1.0
--We put it here to show that users can also do this in their own way
function aac (pr_seq)
    local su = pr_seq:upper()
    local sl = pr_seq:len()
    local rs = {}
    local i
    for i =1,sl do
        local c = su:sub(i,i)
        if AATable[c] then
            local d = AATable[c]
            if rs[d] then
                rs[d] = rs[d] + 1
            else
                rs[d] = 1
            end
        end
    end
    for i=1,20 do
        if rs[i] then
            rs[i] = rs[i] / sl
        else
            rs[i] = 0
        end
    end
    return rs
end

--Triple aa composition
function tripleaac(pr_seq)
    local su = pr_seq:upper()
    local sl = pr_seq:len()
    local rs = {}
    local i
    for i = 1,sl-2 do
        local c1 = su:sub(i,i)
        local c2 = su:sub(i+1,i+1)
        local c3 = su:sub(i+2,i+2)
        if AATable[c1] and AATable[c2] and AATable[c3] then
            local d = AATable[c1] + AATable[c2] * 20 + AATable[c3]*400
            if rs[d] then
                rs[d] = rs[d] + 1
            else
                rs[d] = 1
            end
        end
    end
    for i = 1,8000 do
        if rs[i] then
            rs[i] = rs[i] / (sl - 2)
        else
            rs[i] = 0
        end
    end
    return rs
end

--Emulating Propy's QuasiSequenceOrder function
--Actually, pseb can deal with this using its built-in facility for computing pseacc type 1
--However, we put it here in order to show the flexibility of our infrastructure
function propyQuasiSequanceOrder(pr_seq, order_name, max_delay, weight)
	local order = ordersList[order_name]
	local su = pr_seq:upper()
	local sl = pr_seq:len()
	local pr_aac = aac(pr_seq)
	local tr = {}
	local t_coupling = {}
	local couple_sum = 0
	for i = 1,max_delay do
		local t_sum = 0
		for j = 1,sl - i do
			local tc1 = su:sub(j,j)
			local tc2 = su:sub(j+i, j+i)
			local tc = tc1..tc2
			local to = order[tc]
			if to then
				t_sum = t_sum + to^2
			end
		end
		t_sum = t_sum / (sl - i)
		t_coupling[i] = t_sum
		couple_sum = couple_sum + t_sum
	end
	local adj_sum = 1 + weight * couple_sum
	for i = 1, 20 do
		tr[i] = pr_aac[i] / adj_sum
	end
	for i = 21, 20+max_delay do
		tr[i] = t_coupling[i-20] * weight / adj_sum
	end
	return tr
end

--Emulating Propy's CTD functions
function propyCTD_Composition(pr_seq, propy_prop_name)
	local su = pr_seq:upper()
	local sl = pr_seq:len()
	local spn = propyCTD_SeqToNumber(su,propy_prop_name)
	local tr = {}
	for i = 1,3 do
		local tspn = spn:gsub(tostring(i),"")
		tr[i] = (sl - tspn:len()) / sl
	end
	return tr
end

function propyCTD_Transition(pr_seq, propy_prop_name)
	local su = pr_seq:upper()
	local sl = pr_seq:len()
	local spn = propyCTD_SeqToNumber(su,propy_prop_name)
	local tr = {}
	local tc
	local tcn = 0
	for tc in spn:gmatch("12") do
		tcn = tcn + 1
	end
	for tc in spn:gmatch("21") do
		tcn = tcn + 1
	end
	tr[1] = tcn / (sl - 1)
	tcn = 0
	for tc in spn:gmatch("13") do
		tcn = tcn + 1
	end
	for tc in spn:gmatch("31") do
		tcn = tcn + 1
	end
	tr[2] = tcn / (sl - 1)
	tcn = 0
	for tc in spn:gmatch("23") do
		tcn = tcn + 1
	end
	for tc in spn:gmatch("32") do
		tcn = tcn + 1
	end
	tr[3] = tcn / (sl - 1)
	return tr
end

function propyCTD_Distribution(pr_seq, propy_prop_name)
	local su = pr_seq:upper()
	local sl = pr_seq:len()
	local spn = propyCTD_SeqToNumber(su,propy_prop_name)
	local tr = {}
	local bars={0,0.25,0.5,0.75,1}
	local bincnt = #bars
	local i
	local j
	for i = 1,3 do
		local cpt = tostring(i)
		local cds = {}
		local idx = spn:find(cpt)
		while (idx) do
			cds[#cds+1] = idx
			idx = spn:find(cpt, idx + 1, true)
		end
		local total_count = #cds
		for j = 1,bincnt do
			local cdx = 0
			if (bars[j] == 0) then
				cdx = cds[1] / sl
			else
				cdx = cds[math.floor(bars[j]*total_count)] / sl
			end
			tr[(i-1)*bincnt+(j - 1) + 1] = cdx
		end
	end
	return tr
end

function propyCTD_SeqToNumber(pr_seq,propy_prop_name)
    local pc = propList[propy_prop_name]
    local su = pr_seq:upper()
    for i,v in ipairs(pc) do
        local vl = v:len()
        for j = 1,vl do
            local c = v:sub(j,j)
            su = su:gsub(c,tostring(i))
        end
    end
    return su
end

function MoreauBrotoCoef(pr_seq, max_delay, prop_name)
    local pcseq = ReplaceProtSeq(pr_seq, prop_name)
    local sl = pr_seq:len()
    local tr = {}
    local i
    local j
    for i = 1,max_delay do
        local temp = 0
        for j = 1,sl - max_delay do
			--well, here should be j+i, I think the code in Propy is not correct, while the code in protr should be correct
            temp = temp + pcseq[j]*pcseq[j+i]
        end
        if sl - max_delay ~= 0 then
            tr[i] = temp / (sl - max_delay)
        else
            tr[i] = temp / sl
        end
    end
    return tr
end

function MoranCoef(pr_seq, max_delay, prop_name)
    local pcseq = ReplaceProtSeq(pr_seq, prop_name)
    local sl = pr_seq:len()
    local tm = SeqMean(pcseq,sl)
    local tv = SeqVar(pcseq,sl)
    local tr = {}
    local i
    local j
    for i = 1,max_delay do
        local temp = 0
        for j = 1,sl - max_delay do
            temp = temp + (pcseq[j] - tm)*(pcseq[j+i] - tm)
        end
        if sl - max_delay ~= 0 then
            tr[i] = temp / (sl - max_delay) / tv
        else
            tr[i] = temp / sl / tv
        end
    end
    return tr
end

function GearyCoef(pr_seq, max_delay, prop_name)
    local pcseq = ReplaceProtSeq(pr_seq, prop_name)
    local sl = pr_seq:len()
    local tm = SeqMean(pcseq,sl)
    local tv = SeqVar(pcseq,sl)
    local tr = {}
    local i
    local j
    for i = 1,max_delay do
        local temp = 0
        for j = 1,sl - max_delay do
            temp = temp + (pcseq[j] - pcseq[j+i])^2
        end
        if sl - max_delay ~= 0 then
            tr[i] = temp / 2 / (sl - max_delay) / tv
        else
            tr[i] = temp / 2 / sl / tv
        end
    end
    return tr
end

function ReplaceProtSeq(pr_seq, prop_name)
    if not tempPC[prop_name] then
        tempPC[prop_name] = psebGetPCList(prop_name)
    end
    local pcl = tempPC[prop_name]
    local su = pr_seq:upper()
    local tr = {}
    local sl = su:len()
    local i
    for i = 1,sl do
        local c = su:sub(i,i)
        if pcl[c] then
            tr[i] = pcl[c]
        else
            tr[i] = 0
        end
    end
    return tr;
end

function SeqMean(pcseq, l)
    local ts = 0
    for i = 1,l do
        ts = ts + pcseq[i]
    end
    return ts / l
end

function SeqVar(pcseq, l)
    local ts = 0
    local tm = SeqMean(pcseq,l)
    for i = 1,l do
        ts = ts + (pcseq[i] - tm)^2
    end
    return ts / l
end
